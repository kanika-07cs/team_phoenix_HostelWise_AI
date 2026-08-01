from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.dependencies import get_current_active_user, RoleChecker
from app.models import database as models
from typing import List

router = APIRouter(prefix="/students", tags=["Students"])

all_users = Depends(get_current_active_user)
admin_only = Depends(RoleChecker(["super_admin"]))

@router.get("/", response_model=List[schemas.StudentResponse], dependencies=[all_users])
def read_all_students(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    """List all registered students in the system."""
    return crud.get_students(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.StudentResponse, dependencies=[all_users])
def register_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """Register a new student entry."""
    db_student = db.query(models.Student).filter(models.Student.roll_number == student.roll_number).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student with this Roll Number already exists")
    return crud.create_student(db=db, student=student)


@router.put("/{student_id}", response_model=schemas.StudentResponse, dependencies=[all_users])
def modify_student(student_id: int, student_update: schemas.StudentUpdate, db: Session = Depends(get_db)):
    """Modify student information or status."""
    updated = crud.update_student(db=db, student_id=student_id, student_update=student_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Student not found")
    return updated


@router.post("/allocate", response_model=schemas.RoomAllocationResponse, dependencies=[all_users])
def allocate_student_room(allocation: schemas.RoomAllocationCreate, db: Session = Depends(get_db)):
    """Allocate a student to a room. (Occupancy count auto-increments)."""
    # Verify student exists
    student = crud.get_student(db, student_id=allocation.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Verify room exists and capacity is available
    room = crud.get_room(db, room_id=allocation.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.occupancy >= room.capacity:
        raise HTTPException(status_code=400, detail="Room is already at full capacity")
        
    return crud.allocate_room(db=db, allocation=allocation)


@router.get("/leaves", response_model=List[schemas.LeaveRecordResponse], dependencies=[all_users])
def list_leaves(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List student leave records."""
    return db.query(models.LeaveRecord).order_by(models.LeaveRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/leaves", response_model=schemas.LeaveRecordResponse, dependencies=[all_users])
def create_leave_request(leave: schemas.LeaveRecordCreate, db: Session = Depends(get_db)):
    """Submit a student leave request."""
    student = crud.get_student(db, student_id=leave.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db_leave = models.LeaveRecord(
        student_id=leave.student_id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status="Pending"
    )
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    return db_leave


@router.put("/leaves/{leave_id}", response_model=schemas.LeaveRecordResponse, dependencies=[all_users])
def update_leave_status(leave_id: int, leave_update: schemas.LeaveRecordUpdate, db: Session = Depends(get_db)):
    """Approve or reject a student leave request. (Assigned user is set as approver)."""
    db_leave = db.query(models.LeaveRecord).filter(models.LeaveRecord.id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
        
    db_leave.status = leave_update.status
    db_leave.approved_by = leave_update.approved_by
    
    # If approved, update student status to 'leave'
    if leave_update.status == "Approved":
        student = db.query(models.Student).filter(models.Student.id == db_leave.student_id).first()
        if student:
            student.status = 'leave'
            
    db.commit()
    db.refresh(db_leave)
    return db_leave


@router.post("/biometric", response_model=schemas.AttendanceLogResponse, dependencies=[all_users])
def add_biometric_log(log: schemas.AttendanceLogCreate, db: Session = Depends(get_db)):
    """Log biometric IN/OUT event. Automatically updates student present/outside status."""
    student = crud.get_student(db, student_id=log.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Update student status based on entry/exit direction
    if log.direction == 'IN':
        student.status = 'present'
    elif log.direction == 'OUT':
        student.status = 'outside'
        
    db_log = models.AttendanceBiometricLog(
        student_id=log.student_id,
        direction=log.direction
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
