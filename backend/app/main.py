from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routers import auth, users, hostels, students, energy, reports
from app.models import database as models
from app.core.security import get_password_hash
import joblib
import os

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
            
            # Seed some default students and allocations
            db_admin = db.query(models.User).filter(models.User.username == "admin").first()
            if db_admin:
                # Add default supervisor account
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
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "HostelWise AI Core API is operational. Visit /docs for OpenAPI specifications."}
