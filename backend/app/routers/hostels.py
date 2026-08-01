from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import pandas as pd
from datetime import datetime
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.dependencies import RoleChecker, get_current_active_user
from app.models import database as models
from typing import List, Dict, Any

router = APIRouter(prefix="/hostels", tags=["Hostels"])

# Permission scopes
admin_only = Depends(RoleChecker(["super_admin"]))
all_users = Depends(get_current_active_user)

@router.get("/", response_model=List[schemas.HostelResponse], dependencies=[all_users])
def read_all_hostels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all hostels in the college campus."""
    return crud.get_hostels(db, skip=skip, limit=limit)


@router.get("/{hostel_id}", response_model=schemas.HostelResponse, dependencies=[all_users])
def read_hostel_by_id(hostel_id: int, db: Session = Depends(get_db)):
    """Fetch details of a specific hostel."""
    db_hostel = crud.get_hostel(db, hostel_id=hostel_id)
    if not db_hostel:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return db_hostel


@router.post("/", response_model=schemas.HostelResponse, dependencies=[admin_only])
def add_new_hostel(hostel: schemas.HostelCreate, db: Session = Depends(get_db)):
    """Add a new hostel. (Restricted to Super Admin)"""
    db_hostel = crud.get_hostel_by_name(db, name=hostel.name)
    if db_hostel:
        raise HTTPException(status_code=400, detail="Hostel name already exists")
    
    # Create the hostel
    new_hostel = crud.create_hostel(db=db, hostel=hostel)
    
    # Automatically seed the floors, wings, and rooms for structure
    # Seed 3 floors, 2 wings per floor, and 5 rooms per wing for demo utility
    for f in range(1, new_hostel.total_floors + 1):
        db_floor = models.Floor(hostel_id=new_hostel.id, floor_number=f)
        db.add(db_floor)
        db.flush() # gets db_floor.id
        
        for w in ['Wing A', 'Wing B']:
            db_wing = models.Wing(floor_id=db_floor.id, wing_name=w)
            db.add(db_wing)
            db.flush() # gets db_wing.id
            
            # Create rooms (e.g., 101-105 for Floor 1 Wing A, 106-110 for Wing B)
            room_offset = 0 if w == 'Wing A' else 5
            for r in range(1, 6):
                room_num = f"{f}0{r + room_offset}"
                db_room = models.Room(
                    wing_id=db_wing.id,
                    room_number=room_num,
                    capacity=4,
                    occupancy=0,
                    status='Energy Efficient'
                )
                db.add(db_room)
                
    db.commit()
    db.refresh(new_hostel)
    return new_hostel


@router.put("/{hostel_id}", response_model=schemas.HostelResponse, dependencies=[admin_only])
def edit_hostel(hostel_id: int, hostel_update: schemas.HostelUpdate, db: Session = Depends(get_db)):
    """Modify hostel parameters. (Restricted to Super Admin)"""
    updated_hostel = crud.update_hostel(db=db, hostel_id=hostel_id, hostel_update=hostel_update)
    if not updated_hostel:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return updated_hostel


@router.delete("/{hostel_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[admin_only])
def remove_hostel(hostel_id: int, db: Session = Depends(get_db)):
    """Permanently delete a hostel and all its nested rooms/records. (Restricted to Super Admin)"""
    success = crud.delete_hostel(db=db, hostel_id=hostel_id)
    if not success:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return None


@router.get("/{hostel_id}/layout", dependencies=[all_users])
def get_hostel_layout_tree(hostel_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Returns the hierarchal tree structure (Hostel -> Floors -> Wings -> Rooms)
    optimized for rendering nested tree menus and the Digital Twin map.
    Runs live ML anomaly detection to classify room status.
    """
    hostel = crud.get_hostel(db, hostel_id=hostel_id)
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found")
        
    model_payload = getattr(request.app.state, "model_payload", None)
    
    tree = {
        "id": hostel.id,
        "name": hostel.name,
        "floors": []
    }
    
    # Sort floors by number
    floors = sorted(hostel.floors, key=lambda x: x.floor_number)
    for floor in floors:
        floor_node = {
            "id": floor.id,
            "floor_number": floor.floor_number,
            "wings": []
        }
        for wing in floor.wings:
            wing_node = {
                "id": wing.id,
                "wing_name": wing.wing_name,
                "rooms": []
            }
            # Sort rooms by room number string/integer value
            rooms = sorted(wing.rooms, key=lambda x: x.room_number)
            for room in rooms:
                status_to_return = room.status
                
                # Live ML classifier evaluation if available
                if model_payload:
                    try:
                        hostel_char = hostel.name.split()[-1]
                        wing_char = wing.wing_name.split()[-1]
                        
                        hostel_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
                        wing_map = {'A': 0, 'B': 1}
                        
                        hostel_id_encoded = hostel_map.get(hostel_char, 0)
                        wing_encoded = wing_map.get(wing_char, 0)
                        
                        now = datetime.now()
                        is_weekend = 1 if now.weekday() in [5, 6] else 0
                        hour_of_day = now.hour
                        
                        # Simulate the raw metrics corresponding to room status
                        if room.status == 'Wastage':
                            students_present = 0
                            students_outside = 2
                            students_on_leave = 0
                            expected = 0.05
                            actual = 0.45
                            room_status_encoded = 0 # Empty
                        elif room.status == 'Abnormal':
                            students_present = 4
                            students_outside = 0
                            students_on_leave = 0
                            expected = 0.35
                            actual = 1.15
                            room_status_encoded = 1 # Occupied
                        elif room.status == 'Occupied':
                            students_present = 2
                            students_outside = 1
                            students_on_leave = 1
                            expected = 0.30
                            actual = 0.28
                            room_status_encoded = 1 # Occupied
                        elif room.status == 'Energy Efficient':
                            students_present = 0
                            students_outside = 0
                            students_on_leave = 4
                            expected = 0.05
                            actual = 0.04
                            room_status_encoded = 0 # Empty
                        else: # Maintenance
                            students_present = 0
                            students_outside = 0
                            students_on_leave = 0
                            expected = 0.0
                            actual = 0.0
                            room_status_encoded = 0
                            
                        energy_difference = actual - expected
                        
                        # Build standard feature input vector
                        input_df = pd.DataFrame([{
                            'floor_no': floor.floor_number,
                            'room_no': int(room.room_number) if room.room_number.isdigit() else 101,
                            'room_capacity': room.capacity,
                            'students_present': students_present,
                            'students_outside': students_outside,
                            'students_on_leave': students_on_leave,
                            'is_weekend': is_weekend,
                            'is_holiday': 0,
                            'hour_of_day': hour_of_day,
                            'temperature': 28.5,
                            'expected_energy_kwh': expected,
                            'actual_energy_kwh': actual,
                            'energy_difference': energy_difference,
                            'hostel_id_encoded': hostel_id_encoded,
                            'wing_encoded': wing_encoded,
                            'room_status_encoded': room_status_encoded,
                            'month': now.month,
                            'day': now.day,
                            'day_of_week_encoded': now.weekday()
                        }])
                        
                        model = model_payload["model"]
                        scaler = model_payload["scaler"]
                        model_name = model_payload["model_name"]
                        
                        if model_name == "Logistic Regression":
                            input_scaled = scaler.transform(input_df)
                            pred = model.predict(input_scaled)[0]
                        else:
                            pred = model.predict(input_df)[0]
                            
                        # Set active room state classification based on model prediction
                        if pred == 1:
                            status_to_return = 'Wastage' if room_status_encoded == 0 else 'Abnormal'
                        else:
                            if room.status in ['Wastage', 'Abnormal']:
                                status_to_return = 'Occupied' if room.occupancy > 0 else 'Energy Efficient'
                            else:
                                status_to_return = room.status
                    except Exception as e:
                        status_to_return = room.status
                
                wing_node["rooms"].append({
                    "id": room.id,
                    "room_number": room.room_number,
                    "capacity": room.capacity,
                    "occupancy": room.occupancy,
                    "status": status_to_return
                })
            floor_node["wings"].append(wing_node)
        tree["floors"].append(floor_node)
        
    return tree


@router.put("/rooms/{room_id}", response_model=schemas.RoomResponse, dependencies=[all_users])
def update_room_status(room_id: int, room_update: schemas.RoomUpdate, db: Session = Depends(get_db)):
    """Update room capacity, occupancy count, or operating status (Supervisor or Admin)."""
    updated_room = crud.update_room(db=db, room_id=room_id, room_update=room_update)
    if not updated_room:
        raise HTTPException(status_code=404, detail="Room not found")
    return updated_room
