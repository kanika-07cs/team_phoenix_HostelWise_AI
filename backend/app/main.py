from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routers import auth, users, hostels, students, energy, reports
from app.models import database as models
from app.core.security import get_password_hash
import joblib
import os
from datetime import datetime, timedelta

# Create Database tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Foundational backend for HostelWise AI energy audit system"
)

@app.on_event("startup")
def load_ml_model():
    """Load the saved trained ML model payload at startup."""
    model_path = "best_model.pkl"
    if os.path.exists(model_path):
        try:
            app.state.model_payload = joblib.load(model_path)
            print(f"[FASTAPI STARTUP] ML model loaded successfully from {model_path}!")
            print(f"Selected Classifier: {app.state.model_payload['model_name']}")
        except Exception as e:
            print(f"[FASTAPI STARTUP] Error loading ML model from {model_path}: {e}")
            app.state.model_payload = None
    else:
        print(f"[FASTAPI STARTUP] Warning: ML model file not found at {model_path}")
        app.state.model_payload = None

# CORS Policy - allowing all origins for demo/development convenience
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(hostels.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(energy.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def seed_database():
    """Seed default roles, hostels, and administrator account if tables are empty."""
    db = SessionLocal()
    try:
        # 1. Seed Roles
        admin_role = db.query(models.Role).filter(models.Role.name == "super_admin").first()
        if not admin_role:
            admin_role = models.Role(name="super_admin", description="Super Administrator")
            db.add(admin_role)
        
        supervisor_role = db.query(models.Role).filter(models.Role.name == "supervisor").first()
        if not supervisor_role:
            supervisor_role = models.Role(name="supervisor", description="Hostel Supervisor")
            db.add(supervisor_role)
        
        db.commit()
        db.refresh(admin_role)
        db.refresh(supervisor_role)
        
        # 2. Seed default admin if no users exist
        user_count = db.query(models.User).count()
        if user_count == 0:
            admin_pwd = get_password_hash("admin123")
            admin_user = models.User(
                username="admin",
                email="admin@hostelwise.ai",
                hashed_password=admin_pwd,
                full_name="System Admin",
                role_id=admin_role.id,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            
        # 3. Seed default hostels and structures if empty
        hostel_count = db.query(models.Hostel).count()
        if hostel_count == 0:
            # Seed 4 hostels
            names = ["Hostel A", "Hostel B", "Hostel C", "Hostel D"]
            for name in names:
                hostel = models.Hostel(name=name, total_floors=3, total_rooms=30)
                db.add(hostel)
                db.flush()
                
                # Seed floors
                for f in range(1, 4):
                    floor = models.Floor(hostel_id=hostel.id, floor_number=f)
                    db.add(floor)
                    db.flush()
                    
                    # Seed wings
                    for wing_name in ["Wing A", "Wing B"]:
                        wing = models.Wing(floor_id=floor.id, wing_name=wing_name)
                        db.add(wing)
                        db.flush()
                        
                        # Seed 5 rooms per wing (3 floors * 2 wings * 5 rooms = 30 rooms per hostel)
                        room_offset = 0 if wing_name == "Wing A" else 5
                        for r in range(1, 6):
                            room_num = f"{f}0{r + room_offset}"
                            room = models.Room(
                                wing_id=wing.id,
                                room_number=room_num,
                                capacity=4,
                                occupancy=2, # default 2 students assigned
                                status="Energy Efficient" if r % 2 == 0 else "Occupied"
                            )
                            db.add(room)
            db.commit()
            
            # Seed default supervisor account
            supervisor_pwd = get_password_hash("supervisor123")
            hostel_a = db.query(models.Hostel).filter(models.Hostel.name == "Hostel A").first()
            supervisor_user = models.User(
                username="supervisor",
                email="supervisor@hostelwise.ai",
                hashed_password=supervisor_pwd,
                full_name="Hostel Supervisor",
                role_id=supervisor_role.id,
                assigned_hostel_id=hostel_a.id if hostel_a else None,
                is_active=True
            )
            db.add(supervisor_user)
            db.commit()
            
        # 4. Seed students, allocations, leaves, and energy readings if empty
        student_count = db.query(models.Student).count()
        if student_count == 0:
            import random
            from datetime import timedelta
            
            # Fetch supervisor user to approve leaves
            supervisor_user = db.query(models.User).filter(models.User.username == "supervisor").first()
            supervisor_id = supervisor_user.id if supervisor_user else 1
            
            # Realistic names lists
            first_names = ["Rahul", "Amit", "Pooja", "Neha", "Arjun", "Aditya", "Sneha", "Karan", "Rohan", "Anjali", "Suresh", "Vikram", "Preeti", "Sanjay", "Deepak", "Jyoti", "Manish", "Divya", "Swati", "Rajesh"]
            last_names = ["Sharma", "Verma", "Gupta", "Patel", "Kumar", "Singh", "Joshi", "Deshmukh", "Kulkarni", "Patil", "Reddy", "Nair", "Mishra", "Choudhury", "Pillai", "Rao", "Jadhav", "Bose", "Das", "Sen"]
            
            rooms = db.query(models.Room).all()
            student_idx = 1
            
            for room in rooms:
                wing = room.wing
                floor = wing.floor
                hostel = floor.hostel
                
                # Setup occupancy: if Occupied/Abnormal/Wastage, set 2 students
                if room.status in ["Occupied", "Abnormal", "Wastage"]:
                    room.occupancy = 2
                    
                    for i in range(1, 3):
                        roll = f"CS22B{room.room_number}{student_idx}{hostel.name[-1]}"
                        name = f"{random.choice(first_names)} {random.choice(last_names)}"
                        email = f"{roll.lower()}@college.edu"
                        contact = f"+91 9876{room.room_number}{i}00"
                        
                        # Status distribution
                        status = 'present'
                        rand_val = random.random()
                        if rand_val < 0.08:
                            status = 'leave'
                        elif rand_val < 0.20:
                            status = 'outside'
                            
                        student = models.Student(
                            roll_number=roll,
                            name=name,
                            email=email,
                            contact=contact,
                            status=status
                        )
                        db.add(student)
                        db.flush()
                        
                        # Allocation
                        allocation = models.StudentRoomAllocation(
                            student_id=student.id,
                            room_id=room.id,
                            is_active=True
                        )
                        db.add(allocation)
                        
                        # Biometric log
                        direction = 'IN' if status == 'present' else ('OUT' if status == 'outside' else None)
                        if direction:
                            biometric = models.AttendanceBiometricLog(
                                student_id=student.id,
                                direction=direction,
                                logged_at=datetime.now() - timedelta(hours=random.randint(1, 12))
                            )
                            db.add(biometric)
                            
                        # Leave record
                        if status == 'leave':
                            leave = models.LeaveRecord(
                                student_id=student.id,
                                start_date=datetime.now() - timedelta(days=random.randint(1, 2)),
                                end_date=datetime.now() + timedelta(days=random.randint(1, 3)),
                                reason="Medical recovery / Family urgency trip",
                                status="Approved",
                                approved_by=supervisor_id
                            )
                            db.add(leave)
                        
                        student_idx += 1
                else:
                    room.occupancy = 0
                
                # Seed historical Energy Readings (11 entries per room, spread over last 20 hours)
                current_energy = 120.45
                for h in range(10, -1, -1):
                    log_time = datetime.now() - timedelta(hours=h * 2)
                    
                    if room.status == "Wastage":
                        voltage = float(round(230.0 + random.uniform(-4.0, 4.0), 2))
                        current = float(round(2.8 + random.uniform(-0.15, 0.15), 2))
                        pf = float(round(0.93 + random.uniform(-0.02, 0.02), 2))
                    elif room.status == "Abnormal":
                        voltage = float(round(228.0 + random.uniform(-5.0, 3.0), 2))
                        current = float(round(4.5 + random.uniform(-0.3, 0.3), 2))
                        pf = float(round(0.91 + random.uniform(-0.03, 0.02), 2))
                    elif room.status == "Occupied":
                        voltage = float(round(230.0 + random.uniform(-3.0, 3.0), 2))
                        current = float(round(1.6 * room.occupancy + random.uniform(-0.1, 0.1), 2))
                        pf = float(round(0.95 + random.uniform(-0.01, 0.01), 2))
                    elif room.status == "Energy Efficient":
                        voltage = float(round(231.0 + random.uniform(-2.0, 2.0), 2))
                        current = float(round(0.06 + random.uniform(-0.01, 0.01), 2))
                        pf = float(round(0.96 + random.uniform(-0.01, 0.01), 2))
                    else:
                        voltage = 0.0
                        current = 0.0
                        pf = 0.0
                        
                    power = float(round(voltage * current * pf, 2))
                    current_energy += float(round((power * 2.0) / 1000.0, 4))
                    
                    energy_rec = models.EnergyConsumptionRecord(
                        room_id=room.id,
                        voltage=voltage,
                        current=current,
                        power=power,
                        energy=current_energy,
                        power_factor=pf,
                        frequency=float(round(50.0 + random.uniform(-0.05, 0.05), 2)),
                        logged_at=log_time
                    )
                    db.add(energy_rec)
            db.commit()
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "HostelWise AI Core API is operational. Visit /docs for OpenAPI specifications."}
