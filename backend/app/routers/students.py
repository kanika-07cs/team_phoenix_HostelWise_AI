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

@router.get("/", response_model=List[schemas.StudentResponse])
def read_all_students(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """List all registered students in the system (Filtered for supervisor)."""
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        if not h_id:
            return []
        return db.query(models.Student)\
            .join(models.StudentRoomAllocation, models.Student.id == models.StudentRoomAllocation.student_id)\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == h_id)\
            .filter(models.StudentRoomAllocation.is_active == True)\
            .offset(skip).limit(limit).all()
    return crud.get_students(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.StudentResponse)
def register_student(student: schemas.StudentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Register a new student entry."""
    db_student = db.query(models.Student).filter(models.Student.roll_number == student.roll_number).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student with this Roll Number already exists")
    return crud.create_student(db=db, student=student)


@router.put("/{student_id}", response_model=schemas.StudentResponse)
def modify_student(student_id: int, student_update: schemas.StudentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Modify student information or status."""
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        alloc = db.query(models.StudentRoomAllocation)\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == h_id, models.StudentRoomAllocation.student_id == student_id, models.StudentRoomAllocation.is_active == True)\
            .first()
        if not alloc:
            raise HTTPException(status_code=403, detail="Forbidden: Student does not belong to your hostel")
            
    updated = crud.update_student(db=db, student_id=student_id, student_update=student_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Student not found")
    return updated


@router.post("/allocate", response_model=schemas.RoomAllocationResponse)
def allocate_student_room(allocation: schemas.RoomAllocationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Allocate a student to a room. (Occupancy count auto-increments)."""
    student = crud.get_student(db, student_id=allocation.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    room = crud.get_room(db, room_id=allocation.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        room_h_id = db.query(models.Floor.hostel_id)\
            .join(models.Wing, models.Wing.floor_id == models.Floor.id)\
            .join(models.Room, models.Room.wing_id == models.Wing.id)\
            .filter(models.Room.id == allocation.room_id).scalar()
        if room_h_id != h_id:
            raise HTTPException(status_code=403, detail="Forbidden: Room does not belong to your hostel")
            
    if room.occupancy >= room.capacity:
        raise HTTPException(status_code=400, detail="Room is already at full capacity")
        
    return crud.allocate_room(db=db, allocation=allocation)


@router.get("/leaves", response_model=List[schemas.LeaveRecordResponse])
def list_leaves(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """List student leave records."""
    query = db.query(models.LeaveRecord)
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        if not h_id:
            return []
        query = query.join(models.Student, models.LeaveRecord.student_id == models.Student.id)\
            .join(models.StudentRoomAllocation, models.Student.id == models.StudentRoomAllocation.student_id)\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == h_id)\
            .filter(models.StudentRoomAllocation.is_active == True)
            
    leaves = query.order_by(models.LeaveRecord.created_at.desc()).offset(skip).limit(limit).all()
    res_list = []
    for l in leaves:
        res = schemas.LeaveRecordResponse.from_orm(l)
        res.student_name = l.student.name if l.student else "Unknown"
        res.student_roll = l.student.roll_number if l.student else "Unknown"
        res_list.append(res)
    return res_list


@router.post("/leaves", response_model=schemas.LeaveRecordResponse)
def create_leave_request(leave: schemas.LeaveRecordCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Submit a student leave request."""
    student = crud.get_student(db, student_id=leave.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        alloc = db.query(models.StudentRoomAllocation)\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == h_id, models.StudentRoomAllocation.student_id == leave.student_id, models.StudentRoomAllocation.is_active == True)\
            .first()
        if not alloc:
            raise HTTPException(status_code=403, detail="Forbidden: Student does not belong to your hostel")
            
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
    
    res = schemas.LeaveRecordResponse.from_orm(db_leave)
    res.student_name = student.name
    res.student_roll = student.roll_number
    return res


@router.put("/leaves/{leave_id}", response_model=schemas.LeaveRecordResponse)
def update_leave_status(leave_id: int, leave_update: schemas.LeaveRecordUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Approve or reject a student leave request. (Assigned user is set as approver)."""
    db_leave = db.query(models.LeaveRecord).filter(models.LeaveRecord.id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
        
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        alloc = db.query(models.StudentRoomAllocation)\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == h_id, models.StudentRoomAllocation.student_id == db_leave.student_id, models.StudentRoomAllocation.is_active == True)\
            .first()
        if not alloc:
            raise HTTPException(status_code=403, detail="Forbidden: Student does not belong to your hostel")
            
    db_leave.status = leave_update.status
    db_leave.approved_by = leave_update.approved_by
    
    # If approved, update student status to 'leave'
    if leave_update.status == "Approved":
        student = db.query(models.Student).filter(models.Student.id == db_leave.student_id).first()
        if student:
            student.status = 'leave'
            
    db.commit()
    db.refresh(db_leave)
    
    res = schemas.LeaveRecordResponse.from_orm(db_leave)
    res.student_name = db_leave.student.name if db_leave.student else "Unknown"
    res.student_roll = db_leave.student.roll_number if db_leave.student else "Unknown"
    return res


@router.post("/biometric", response_model=schemas.AttendanceLogResponse)
def add_biometric_log(log: schemas.AttendanceLogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Log biometric IN/OUT event. Automatically updates student present/outside status."""
    student = crud.get_student(db, student_id=log.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        alloc = db.query(models.StudentRoomAllocation)\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == h_id, models.StudentRoomAllocation.student_id == log.student_id, models.StudentRoomAllocation.is_active == True)\
            .first()
        if not alloc:
            raise HTTPException(status_code=403, detail="Forbidden: Student does not belong to your hostel")
            
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
