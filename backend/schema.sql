-- MySQL Schema for HostelWise AI: Smart Hostel Energy Management System

-- Drop tables if they exist to allow clean setups (ordered to satisfy dependencies)
DROP TABLE IF EXISTS energy_consumption_records;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS leave_records;
DROP TABLE IF EXISTS attendance_biometric_logs;
DROP TABLE IF EXISTS student_room_allocations;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS wings;
DROP TABLE IF EXISTS floors;
DROP TABLE IF EXISTS hostels;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 1. Roles Table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('super_admin', 'System administrator with full control over all hostels, users, and global configuration.'),
('supervisor', 'Hostel supervisor restricted to managing and viewing their assigned hostel and room list.');

-- 2. Users Table (Supervisors and Admins)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    assigned_hostel_id INT NULL, -- NULL for super_admin, references hostels(id) for supervisor
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 3. Hostels Table
CREATE TABLE hostels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    total_floors INT NOT NULL DEFAULT 1,
    total_rooms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Link users' assigned_hostel_id to hostels(id)
ALTER TABLE users ADD CONSTRAINT fk_user_assigned_hostel 
FOREIGN KEY (assigned_hostel_id) REFERENCES hostels(id) ON DELETE SET NULL;

-- 4. Floors Table
CREATE TABLE floors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NOT NULL,
    floor_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hostel_floor (hostel_id, floor_number),
    FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
);

-- 5. Wings Table
CREATE TABLE wings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    wing_name VARCHAR(50) NOT NULL, -- e.g., 'Wing A', 'Wing B'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_floor_wing (floor_id, wing_name),
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
);

-- 6. Rooms Table
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wing_id INT NOT NULL,
    room_number VARCHAR(50) NOT NULL, -- e.g., '101', '102'
    capacity INT NOT NULL DEFAULT 4,
    occupancy INT NOT NULL DEFAULT 0,
    status ENUM('Occupied', 'Energy Efficient', 'Abnormal', 'Wastage', 'Maintenance') DEFAULT 'Energy Efficient',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wing_room (wing_id, room_number),
    FOREIGN KEY (wing_id) REFERENCES wings(id) ON DELETE CASCADE
);

-- 7. Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contact VARCHAR(50),
    status ENUM('present', 'outside', 'leave') DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Student Room Allocation Table (Many-to-Many but usually active is unique per student)
CREATE TABLE student_room_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    room_id INT NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 9. Attendance / Biometric Logs
CREATE TABLE attendance_biometric_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    direction ENUM('IN', 'OUT') NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 10. Leave Records
CREATE TABLE leave_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Energy Consumption Records (Smart Meter Logs)
CREATE TABLE energy_consumption_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    voltage DECIMAL(5,2) NOT NULL, -- e.g., 230.50
    current DECIMAL(5,2) NOT NULL, -- e.g., 4.25
    power DECIMAL(8,2) NOT NULL,   -- Watts, e.g., 980.50
    energy DECIMAL(12,2) NOT NULL,  -- Cumulative kWh, e.g., 12500.45
    power_factor DECIMAL(3,2) NOT NULL, -- e.g., 0.95
    frequency DECIMAL(4,2) NOT NULL, -- e.g., 50.02
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 12. Reports Table
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Daily', 'Weekly', 'Monthly') NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by INT NOT NULL,
    file_path VARCHAR(512),
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Indexes for performance optimization
CREATE INDEX idx_energy_room ON energy_consumption_records(room_id, logged_at);
CREATE INDEX idx_biometric_student ON attendance_biometric_logs(student_id, logged_at);
CREATE INDEX idx_allocations_active ON student_room_allocations(is_active, room_id);
CREATE INDEX idx_leave_dates ON leave_records(start_date, end_date);
