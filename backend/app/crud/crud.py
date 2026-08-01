from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import database as models
from app.schemas import schemas
from app.core.security import get_password_hash
from datetime import datetime

# --- USER CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role_id=user.role_id,
        assigned_hostel_id=user.assigned_hostel_id,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# --- HOSTEL CRUD ---
def get_hostels(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Hostel).offset(skip).limit(limit).all()

def get_hostel(db: Session, hostel_id: int):
    return db.query(models.Hostel).filter(models.Hostel.id == hostel_id).first()

def get_hostel_by_name(db: Session, name: str):
    return db.query(models.Hostel).filter(models.Hostel.name == name).first()

def create_hostel(db: Session, hostel: schemas.HostelCreate):
    db_hostel = models.Hostel(
        name=hostel.name,
        total_floors=hostel.total_floors,
        total_rooms=hostel.total_rooms
    )
    db.add(db_hostel)
    db.commit()
    db.refresh(db_hostel)
    return db_hostel

def update_hostel(db: Session, hostel_id: int, hostel_update: schemas.HostelUpdate):
    db_hostel = get_hostel(db, hostel_id)
    if not db_hostel:
        return None
    
    update_data = hostel_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_hostel, key, value)
        
    db.commit()
    db.refresh(db_hostel)
    return db_hostel

def delete_hostel(db: Session, hostel_id: int):
    db_hostel = get_hostel(db, hostel_id)
    if db_hostel:
        db.delete(db_hostel)
        db.commit()
        return True
    return False


# --- ROOMS CRUD ---
def get_rooms(db: Session, skip: int = 0, limit: int = 500):
    return db.query(models.Room).offset(skip).limit(limit).all()

def get_room(db: Session, room_id: int):
    return db.query(models.Room).filter(models.Room.id == room_id).first()

def create_room(db: Session, room: schemas.RoomCreate):
    db_room = models.Room(
        wing_id=room.wing_id,
        room_number=room.room_number,
        capacity=room.capacity,
        occupancy=room.occupancy,
        status=room.status
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def update_room(db: Session, room_id: int, room_update: schemas.RoomUpdate):
    db_room = get_room(db, room_id)
    if not db_room:
        return None
    
    update_data = room_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_room, key, value)
        
    db.commit()
    db.refresh(db_room)
    return db_room


# --- STUDENT CRUD ---
def get_students(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Student).offset(skip).limit(limit).all()

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(
        roll_number=student.roll_number,
        name=student.name,
        email=student.email,
        contact=student.contact,
        status=student.status
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_update: schemas.StudentUpdate):
    db_student = get_student(db, student_id)
    if not db_student:
        return None
    
    update_data = student_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_student, key, value)
        
    db.commit()
    db.refresh(db_student)
    return db_student

def allocate_room(db: Session, allocation: schemas.RoomAllocationCreate):
    # Deactivate any previous active allocation for this student
    db.query(models.StudentRoomAllocation).filter(
        and_(models.StudentRoomAllocation.student_id == allocation.student_id, 
             models.StudentRoomAllocation.is_active == True)
    ).update({"is_active": False})
    
    db_alloc = models.StudentRoomAllocation(
        student_id=allocation.student_id,
        room_id=allocation.room_id,
        is_active=True
    )
    db.add(db_alloc)
    
    # Increment room occupancy
    room = get_room(db, allocation.room_id)
    if room and room.occupancy < room.capacity:
        room.occupancy += 1
        room.status = 'Occupied'
        
    db.commit()
    db.refresh(db_alloc)
    return db_alloc


# --- ENERGY CONSUMPTION CRUD ---
def create_energy_reading(db: Session, reading: schemas.EnergyReadingCreate):
    db_reading = models.EnergyConsumptionRecord(
        room_id=reading.room_id,
        voltage=reading.voltage,
        current=reading.current,
        power=reading.power,
        energy=reading.energy,
        power_factor=reading.power_factor,
        frequency=reading.frequency
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

def get_energy_records(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.EnergyConsumptionRecord).order_by(models.EnergyConsumptionRecord.logged_at.desc()).offset(skip).limit(limit).all()

def get_room_energy(db: Session, room_id: int, limit: int = 100):
    return db.query(models.EnergyConsumptionRecord).filter(
        models.EnergyConsumptionRecord.room_id == room_id
    ).order_by(models.EnergyConsumptionRecord.logged_at.desc()).limit(limit).all()


# --- REPORTS CRUD ---
def create_report_record(db: Session, report: schemas.ReportCreate):
    db_report = models.Report(
        name=report.name,
        type=report.type,
        generated_by=report.generated_by,
        file_path=report.file_path
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_reports(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Report).order_by(models.Report.generated_at.desc()).offset(skip).limit(limit).all()
