from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    assigned_hostel_id = Column(Integer, ForeignKey("hostels.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    role = relationship("Role", back_populates="users")
    assigned_hostel = relationship("Hostel", back_populates="supervisors")
    approved_leaves = relationship("LeaveRecord", back_populates="approver")
    generated_reports = relationship("Report", back_populates="creator")


class Hostel(Base):
    __tablename__ = "hostels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    total_floors = Column(Integer, default=1, nullable=False)
    total_rooms = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    supervisors = relationship("User", back_populates="assigned_hostel")
    floors = relationship("Floor", back_populates="hostel", cascade="all, delete-orphan")


class Floor(Base):
    __tablename__ = "floors"
    
    id = Column(Integer, primary_key=True, index=True)
    hostel_id = Column(Integer, ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False)
    floor_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    hostel = relationship("Hostel", back_populates="floors")
    wings = relationship("Wing", back_populates="floor", cascade="all, delete-orphan")


class Wing(Base):
    __tablename__ = "wings"
    
    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="CASCADE"), nullable=False)
    wing_name = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    floor = relationship("Floor", back_populates="wings")
    rooms = relationship("Room", back_populates="wing", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    wing_id = Column(Integer, ForeignKey("wings.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(50), nullable=False)
    capacity = Column(Integer, default=4, nullable=False)
    occupancy = Column(Integer, default=0, nullable=False)
    status = Column(Enum('Occupied', 'Energy Efficient', 'Abnormal', 'Wastage', 'Maintenance', name="room_status"), default='Energy Efficient')
    created_at = Column(DateTime, server_default=func.now())
    
    wing = relationship("Wing", back_populates="rooms")
    allocations = relationship("StudentRoomAllocation", back_populates="room", cascade="all, delete-orphan")
    energy_records = relationship("EnergyConsumptionRecord", back_populates="room", cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    contact = Column(String(50), nullable=True)
    status = Column(Enum('present', 'outside', 'leave', name="student_status"), default='present')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    allocations = relationship("StudentRoomAllocation", back_populates="student", cascade="all, delete-orphan")
    biometric_logs = relationship("AttendanceBiometricLog", back_populates="student", cascade="all, delete-orphan")
    leave_records = relationship("LeaveRecord", back_populates="student", cascade="all, delete-orphan")


class StudentRoomAllocation(Base):
    __tablename__ = "student_room_allocations"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    allocated_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    student = relationship("Student", back_populates="allocations")
    room = relationship("Room", back_populates="allocations")


class AttendanceBiometricLog(Base):
    __tablename__ = "attendance_biometric_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    direction = Column(Enum('IN', 'OUT', name="log_direction"), nullable=False)
    logged_at = Column(DateTime, server_default=func.now())
    
    student = relationship("Student", back_populates="biometric_logs")


class LeaveRecord(Base):
    __tablename__ = "leave_records"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(Enum('Pending', 'Approved', 'Rejected', name="leave_status"), default='Pending')
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    student = relationship("Student", back_populates="leave_records")
    approver = relationship("User", back_populates="approved_leaves")


class EnergyConsumptionRecord(Base):
    __tablename__ = "energy_consumption_records"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    voltage = Column(Numeric(5, 2), nullable=False)
    current = Column(Numeric(5, 2), nullable=False)
    power = Column(Numeric(8, 2), nullable=False)
    energy = Column(Numeric(12, 2), nullable=False)
    power_factor = Column(Numeric(3, 2), nullable=False)
    frequency = Column(Numeric(4, 2), nullable=False)
    logged_at = Column(DateTime, server_default=func.now())
    
    room = relationship("Room", back_populates="energy_records")


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum('Daily', 'Weekly', 'Monthly', name="report_type"), nullable=False)
    generated_at = Column(DateTime, server_default=func.now())
    generated_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    file_path = Column(String(512), nullable=True)
    
    creator = relationship("User", back_populates="generated_reports")
