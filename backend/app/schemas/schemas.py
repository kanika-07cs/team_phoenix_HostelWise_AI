from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

# --- AUTH & TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# --- ROLE SCHEMAS ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    class Config:
        from_attributes = True

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role_id: int
    assigned_hostel_id: Optional[int] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    assigned_hostel_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    role_name: Optional[str] = None # Custom populated field
    assigned_hostel_name: Optional[str] = None # Custom populated field

    class Config:
        from_attributes = True

# --- HOSTEL SCHEMAS ---
class HostelBase(BaseModel):
    name: str
    total_floors: int = Field(default=1, ge=1)
    total_rooms: int = Field(default=0, ge=0)

class HostelCreate(HostelBase):
    pass

class HostelUpdate(BaseModel):
    name: Optional[str] = None
    total_floors: Optional[int] = None
    total_rooms: Optional[int] = None

class HostelResponse(HostelBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- FLOOR & WING SCHEMAS ---
class FloorBase(BaseModel):
    hostel_id: int
    floor_number: int

class FloorResponse(FloorBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class WingBase(BaseModel):
    floor_id: int
    wing_name: str

class WingResponse(WingBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- ROOM SCHEMAS ---
class RoomBase(BaseModel):
    wing_id: int
    room_number: str
    capacity: int = Field(default=4, ge=1)
    occupancy: int = Field(default=0, ge=0)
    status: str = "Energy Efficient"

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    capacity: Optional[int] = None
    occupancy: Optional[int] = None
    status: Optional[str] = None

class RoomResponse(RoomBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- STUDENT SCHEMAS ---
class StudentBase(BaseModel):
    roll_number: str
    name: str
    email: EmailStr
    contact: Optional[str] = None
    status: str = "present"

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact: Optional[str] = None
    status: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- ALLOCATION SCHEMAS ---
class RoomAllocationCreate(BaseModel):
    student_id: int
    room_id: int

class RoomAllocationResponse(RoomAllocationCreate):
    id: int
    allocated_at: datetime
    is_active: bool
    class Config:
        from_attributes = True

# --- ATTENDANCE & LEAVE SCHEMAS ---
class AttendanceLogCreate(BaseModel):
    student_id: int
    direction: str # 'IN' or 'OUT'

class AttendanceLogResponse(AttendanceLogCreate):
    id: int
    logged_at: datetime
    class Config:
        from_attributes = True

class LeaveRecordCreate(BaseModel):
    student_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRecordUpdate(BaseModel):
    status: str # 'Approved' or 'Rejected'
    approved_by: int

class LeaveRecordResponse(BaseModel):
    id: int
    student_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: str
    approved_by: Optional[int] = None
    created_at: datetime
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    class Config:
        from_attributes = True

# --- ENERGY CONSUMPTION SCHEMAS ---
class EnergyReadingCreate(BaseModel):
    room_id: int
    voltage: Decimal
    current: Decimal
    power: Decimal
    energy: Decimal
    power_factor: Decimal
    frequency: Decimal

class EnergyReadingResponse(EnergyReadingCreate):
    id: int
    logged_at: datetime
    class Config:
        from_attributes = True

# --- REPORTS SCHEMAS ---
class ReportCreate(BaseModel):
    name: str
    type: str # 'Daily', 'Weekly', 'Monthly'
    generated_by: int
    file_path: Optional[str] = None

class ReportResponse(ReportCreate):
    id: int
    generated_at: datetime
    class Config:
        from_attributes = True
