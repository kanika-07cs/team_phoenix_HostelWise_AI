from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.dependencies import get_current_active_user
from app.models import database as models
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/energy", tags=["Energy"])

all_users = Depends(get_current_active_user)

@router.post("/readings", response_model=schemas.EnergyReadingResponse)
def log_energy_reading(reading: schemas.EnergyReadingCreate, db: Session = Depends(get_db)):
    """Simulate smart meter posting a periodic reading. (Voltage, current, power, power factor, frequency)."""
    # Verify room exists
    room = crud.get_room(db, room_id=reading.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    return crud.create_energy_reading(db=db, reading=reading)


@router.get("/consumption", response_model=List[schemas.EnergyReadingResponse])
def read_energy_consumption(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Fetch energy readings chronological log (scoped for supervisor)."""
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        if not h_id:
            return []
        return db.query(models.EnergyConsumptionRecord)\
            .join(models.Room, models.EnergyConsumptionRecord.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == h_id)\
            .order_by(models.EnergyConsumptionRecord.logged_at.desc())\
            .offset(skip).limit(limit).all()
            
    return crud.get_energy_records(db, skip=skip, limit=limit)


@router.get("/consumption/room/{room_id}", response_model=List[schemas.EnergyReadingResponse])
def read_room_energy_consumption(room_id: int, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Fetch recent smart meter readings for a specific room (scoped for supervisor)."""
    if current_user.role.name == "supervisor":
        h_id = current_user.assigned_hostel_id
        # Trace room to hostel_id
        room_h_id = db.query(models.Floor.hostel_id)\
            .join(models.Wing, models.Wing.floor_id == models.Floor.id)\
            .join(models.Room, models.Room.wing_id == models.Wing.id)\
            .filter(models.Room.id == room_id).scalar()
        if room_h_id != h_id:
            raise HTTPException(status_code=403, detail="Forbidden: Room does not belong to your hostel")
            
    return crud.get_room_energy(db, room_id=room_id, limit=limit)


@router.get("/overview")
def get_energy_campus_overview(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """
    Returns aggregated real-time campus energy metrics:
    occupancy percentage, power, voltage, cumulative cost, carbon emissions,
    and actual vs expected energy forecasts. (Filtered by supervisor hostel).
    """
    is_supervisor = current_user.role.name == "supervisor"
    hostel_id = current_user.assigned_hostel_id if is_supervisor else None
    
    # 1. Counts
    if is_supervisor:
        total_hostels = 1
        total_floors = db.query(func.count(models.Floor.id)).filter(models.Floor.hostel_id == hostel_id).scalar() or 0
        total_rooms = db.query(func.count(models.Room.id))\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == hostel_id).scalar() or 0
    else:
        total_hostels = db.query(func.count(models.Hostel.id)).scalar() or 0
        total_floors = db.query(func.count(models.Floor.id)).scalar() or 0
        total_rooms = db.query(func.count(models.Room.id)).scalar() or 0
    
    # 2. Occupancy metrics
    if is_supervisor:
        occupied_count = db.query(func.count(models.StudentRoomAllocation.id))\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == hostel_id, models.StudentRoomAllocation.is_active == True).scalar() or 0
            
        students_query = db.query(models.Student)\
            .join(models.StudentRoomAllocation, models.Student.id == models.StudentRoomAllocation.student_id)\
            .join(models.Room, models.StudentRoomAllocation.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == hostel_id)\
            .filter(models.StudentRoomAllocation.is_active == True)
            
        students_present = students_query.filter(models.Student.status == 'present').count()
        students_outside = students_query.filter(models.Student.status == 'outside').count()
        students_leave = students_query.filter(models.Student.status == 'leave').count()
    else:
        occupied_count = db.query(func.count(models.StudentRoomAllocation.id)).filter(models.StudentRoomAllocation.is_active == True).scalar() or 0
        students_present = db.query(func.count(models.Student.id)).filter(models.Student.status == 'present').scalar() or 0
        students_outside = db.query(func.count(models.Student.id)).filter(models.Student.status == 'outside').scalar() or 0
        students_leave = db.query(func.count(models.Student.id)).filter(models.Student.status == 'leave').scalar() or 0
        
    # If database is empty, return defaults
    if total_rooms == 0:
        total_hostels = 1 if is_supervisor else 4
        total_floors = 3 if is_supervisor else 16
        total_rooms = 30 if is_supervisor else 256
        occupied_count = 20 if is_supervisor else 192
        students_present = 40 if is_supervisor else 768
        students_outside = 8 if is_supervisor else 180
        students_leave = 4 if is_supervisor else 76

    # 3. Energy consumption values (dynamic based on rooms count)
    scale = total_rooms / 256.0
    
    # Try querying actual sum from DB
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    db_energy = 0.0
    if is_supervisor:
        db_energy = db.query(func.sum(models.EnergyConsumptionRecord.power))\
            .join(models.Room, models.EnergyConsumptionRecord.room_id == models.Room.id)\
            .join(models.Wing, models.Room.wing_id == models.Wing.id)\
            .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
            .filter(models.Floor.hostel_id == hostel_id)\
            .filter(models.EnergyConsumptionRecord.logged_at >= today_start)\
            .scalar() or 0.0
        db_energy = float(db_energy) / 1000.0 # W to kWh simulation approximation
    else:
        db_energy = db.query(func.sum(models.EnergyConsumptionRecord.power))\
            .filter(models.EnergyConsumptionRecord.logged_at >= today_start)\
            .scalar() or 0.0
        db_energy = float(db_energy) / 1000.0
        
    today_kwh = db_energy if db_energy > 0 else round(1284.50 * scale, 2)
    expected_kwh = round(today_kwh * 1.13, 2)
    current_kw = round(54.20 * scale, 2)
    
    avg_voltage = 230.40
    power_factor = 0.94
    cost_per_kwh = 12.50
    current_cost = today_kwh * cost_per_kwh
    co2_factor = 0.85
    today_co2 = today_kwh * co2_factor
    today_savings = max(0.0, expected_kwh - today_kwh) * cost_per_kwh
    
    # Proportional Trend Data Lists to avoid frontend hardcoding
    base_daily = [
        { 'time': '00:00', 'Expected': 50, 'Actual': 45 },
        { 'time': '04:00', 'Expected': 40, 'Actual': 38 },
        { 'time': '08:00', 'Expected': 90, 'Actual': 102 },
        { 'time': '12:00', 'Expected': 120, 'Actual': 115 },
        { 'time': '16:00', 'Expected': 110, 'Actual': 105 },
        { 'time': '20:00', 'Expected': 150, 'Actual': 132 },
        { 'time': '23:00', 'Expected': 80, 'Actual': 75 }
    ]
    daily_trend = [{'time': x['time'], 'Expected': round(x['Expected'] * scale, 1), 'Actual': round(x['Actual'] * scale, 1)} for x in base_daily]
    
    base_weekly = [
        { 'time': 'Mon', 'Expected': 1200, 'Actual': 1140 },
        { 'time': 'Tue', 'Expected': 1250, 'Actual': 1190 },
        { 'time': 'Wed', 'Expected': 1300, 'Actual': 1210 },
        { 'time': 'Thu', 'Expected': 1280, 'Actual': 1190 },
        { 'time': 'Fri', 'Expected': 1350, 'Actual': 1260 },
        { 'time': 'Sat', 'Expected': 950, 'Actual': 890 },
        { 'time': 'Sun', 'Expected': 900, 'Actual': 810 }
    ]
    weekly_trend = [{'time': x['time'], 'Expected': round(x['Expected'] * scale, 1), 'Actual': round(x['Actual'] * scale, 1)} for x in base_weekly]

    base_monthly = [
        { 'time': 'Week 1', 'Expected': 8500, 'Actual': 7900 },
        { 'time': 'Week 2', 'Expected': 8800, 'Actual': 8150 },
        { 'time': 'Week 3', 'Expected': 9100, 'Actual': 8320 },
        { 'time': 'Week 4', 'Expected': 8900, 'Actual': 8180 }
    ]
    monthly_trend = [{'time': x['time'], 'Expected': round(x['Expected'] * scale, 1), 'Actual': round(x['Actual'] * scale, 1)} for x in base_monthly]

    # Hostel breakdowns
    hostels_list = db.query(models.Hostel).all()
    hostel_breakdown = []
    for h in hostels_list:
        if is_supervisor and h.id != hostel_id:
            continue
        h_rooms = db.query(func.count(models.Room.id)).join(models.Wing).join(models.Floor).filter(models.Floor.hostel_id == h.id).scalar() or 30
        h_occ = db.query(func.count(models.StudentRoomAllocation.id)).join(models.Room).join(models.Wing).join(models.Floor).filter(models.Floor.hostel_id == h.id, models.StudentRoomAllocation.is_active == True).scalar() or 20
        h_scale = h_rooms / 256.0
        h_cons = round(1284.5 * h_scale, 2)
        hostel_breakdown.append({
            "name": h.name,
            "consumption": h_cons,
            "rooms": h_rooms,
            "occupancy": h_occ,
            "cost": round(h_cons * cost_per_kwh, 2)
        })
        
    # Scoped alerts list
    all_alerts = [
        {"id": 1, "room": "Room 104", "hostel_id": 1, "hostel": "Hostel A", "type": "Wastage", "message": "HVAC running in empty room detected", "severity": "High", "time": "10 mins ago"},
        {"id": 2, "room": "Room 208", "hostel_id": 2, "hostel": "Hostel B", "type": "Abnormal", "message": "High active power load (1.8 kW) in unoccupied room", "severity": "Warning", "time": "25 mins ago"},
        {"id": 3, "room": "Room 301", "hostel_id": 3, "hostel": "Hostel C", "type": "Voltage Drop", "message": "Line voltage dropped to 205V", "severity": "Info", "time": "1 hour ago"},
        {"id": 4, "room": "Room 112", "hostel_id": 1, "hostel": "Hostel A", "type": "Maintenance", "message": "Smart Meter offline since 12:00 PM", "severity": "Warning", "time": "3 hours ago"}
    ]
    recent_alerts = []
    for alert in all_alerts:
        if is_supervisor and alert["hostel_id"] != hostel_id:
            continue
        recent_alerts.append(alert)
        
    summary_data = {
        "total_hostels": total_hostels,
        "total_floors": total_floors,
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_count,
        "occupancy_rate": round((occupied_count / total_rooms) * 100, 2) if total_rooms > 0 else 75.0,
        "students_present": students_present,
        "students_outside": students_outside,
        "students_leave": students_leave,
    }
    
    if is_supervisor:
        assigned_hostel = db.query(models.Hostel).filter(models.Hostel.id == hostel_id).first()
        summary_data["hostel_name"] = assigned_hostel.name if assigned_hostel else "Assigned Hostel"
        
    return {
        "summary": summary_data,
        "realtime": {
            "voltage": avg_voltage,
            "current_load": current_kw,
            "frequency": 50.02,
            "power_factor": power_factor,
            "today_consumption_kwh": today_kwh,
            "expected_consumption_kwh": expected_kwh,
            "today_cost": round(current_cost, 2),
            "today_savings_cost": round(today_savings, 2),
            "today_co2_kg": round(today_co2, 2),
            "trees_equivalent": int(today_co2 / 20)
        },
        "hostels": hostel_breakdown,
        "alerts": recent_alerts,
        "daily_trend": daily_trend,
        "weekly_trend": weekly_trend,
        "monthly_trend": monthly_trend
    }


@router.get("/analytics")
def get_energy_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Exposes deep energy analytics filtered by supervisor assigned hostel."""
    is_supervisor = current_user.role.name == "supervisor"
    hostel_id = current_user.assigned_hostel_id if is_supervisor else 1
    
    # Scale parameters
    total_rooms = db.query(func.count(models.Room.id))\
        .join(models.Wing, models.Room.wing_id == models.Wing.id)\
        .join(models.Floor, models.Wing.floor_id == models.Floor.id)\
        .filter(models.Floor.hostel_id == hostel_id).scalar() or 30
    scale = total_rooms / 256.0
    
    # Active Load chart details
    analytics_daily = [
      { "name": '00:00', "ActiveLoad": round(35 * scale, 1), "PassiveLoad": round(12 * scale, 1) },
      { "name": '04:00', "ActiveLoad": round(28 * scale, 1), "PassiveLoad": round(10 * scale, 1) },
      { "name": '08:00', "ActiveLoad": round(92 * scale, 1), "PassiveLoad": round(18 * scale, 1) },
      { "name": '12:00', "ActiveLoad": round(125 * scale, 1), "PassiveLoad": round(20 * scale, 1) },
      { "name": '16:00', "ActiveLoad": round(98 * scale, 1), "PassiveLoad": round(15 * scale, 1) },
      { "name": '20:00', "ActiveLoad": round(145 * scale, 1), "PassiveLoad": round(25 * scale, 1) },
      { "name": '23:00', "ActiveLoad": round(65 * scale, 1), "PassiveLoad": round(12 * scale, 1) },
    ]
    analytics_weekly = [
      { "name": 'Mon', "ActiveLoad": round(980 * scale, 1), "PassiveLoad": round(180 * scale, 1) },
      { "name": 'Tue', "ActiveLoad": round(910 * scale, 1), "PassiveLoad": round(160 * scale, 1) },
      { "name": 'Wed', "ActiveLoad": round(1020 * scale, 1), "PassiveLoad": round(190 * scale, 1) },
      { "name": 'Thu', "ActiveLoad": round(960 * scale, 1), "PassiveLoad": round(170 * scale, 1) },
      { "name": 'Fri', "ActiveLoad": round(1150 * scale, 1), "PassiveLoad": round(210 * scale, 1) },
      { "name": 'Sat', "ActiveLoad": round(780 * scale, 1), "PassiveLoad": round(140 * scale, 1) },
      { "name": 'Sun', "ActiveLoad": round(710 * scale, 1), "PassiveLoad": round(120 * scale, 1) },
    ]
    analytics_monthly = [
      { "name": 'Week 1', "ActiveLoad": round(6800 * scale, 1), "PassiveLoad": round(1100 * scale, 1) },
      { "name": 'Week 2', "ActiveLoad": round(7100 * scale, 1), "PassiveLoad": round(1250 * scale, 1) },
      { "name": 'Week 3', "ActiveLoad": round(7400 * scale, 1), "PassiveLoad": round(1300 * scale, 1) },
      { "name": 'Week 4', "ActiveLoad": round(7200 * scale, 1), "PassiveLoad": round(1200 * scale, 1) },
    ]
    
    # Rankings compiled dynamically from Floors and Wings of the assigned hostel
    # Fetch from database
    results = db.query(
        models.Floor.floor_number,
        models.Wing.wing_name,
        func.sum(models.EnergyConsumptionRecord.energy).label("total_energy")
    )\
    .join(models.Wing, models.Wing.floor_id == models.Floor.id)\
    .join(models.Room, models.Room.wing_id == models.Wing.id)\
    .join(models.EnergyConsumptionRecord, models.EnergyConsumptionRecord.room_id == models.Room.id)\
    .filter(models.Floor.hostel_id == hostel_id)\
    .group_by(models.Floor.floor_number, models.Wing.wing_name)\
    .all()
    
    highest_consuming = []
    lowest_consuming = []
    
    if len(results) >= 2:
        # Sort results
        sorted_res = sorted(results, key=lambda x: x.total_energy, reverse=True)
        for r in sorted_res[:2]:
            highest_consuming.append({
                "name": f"Floor {r.floor_number} {r.wing_name}",
                "detail": "High active usage",
                "value": f"{round(float(r.total_energy) / 10.0, 1)} kWh",
                "color": "text-brand-danger bg-red-50"
            })
        for r in sorted_res[-2:]:
            lowest_consuming.append({
                "name": f"Floor {r.floor_number} {r.wing_name}",
                "detail": "Efficient standby state",
                "value": f"{round(float(r.total_energy) / 15.0, 1)} kWh",
                "color": "text-brand-success bg-green-50"
            })
    else:
        # Fallback values specific to the floors of this hostel
        floors = db.query(models.Floor).filter(models.Floor.hostel_id == hostel_id).all()
        floor_nums = [f.floor_number for f in floors] if floors else [1, 2, 3]
        
        highest_consuming = [
            {"name": f"Floor {max(floor_nums)} Wing A", "detail": "High active HVAC loads", "value": f"{round(180.5 * scale, 1)} kWh", "color": "text-brand-danger bg-red-50"},
            {"name": f"Floor {min(floor_nums)} Wing B", "detail": "Idle socket usage", "value": f"{round(154.2 * scale, 1)} kWh", "color": "text-brand-danger bg-red-50"}
        ]
        lowest_consuming = [
            {"name": f"Floor {sorted(floor_nums)[len(floor_nums)//2]} Wing A", "detail": "Optimal LED standby", "value": f"{round(88.0 * scale, 1)} kWh", "color": "text-brand-success bg-green-50"},
            {"name": f"Floor {max(floor_nums)} Wing B", "detail": "Biometric sleep cycle", "value": f"{round(112.4 * scale, 1)} kWh", "color": "text-brand-success bg-green-50"}
        ]
        
    highest_savings = [
        {"name": f"{highest_consuming[0]['name']} override", "detail": "Automated schedule cut", "value": f"{int(48 * scale)} kWh saved", "color": "text-brand-success bg-green-50"},
        {"name": f"Standby optimization", "detail": "Unoccupied wing shutdown", "value": f"{int(35 * scale)} kWh saved", "color": "text-brand-success bg-green-50"}
    ]
    
    return {
        "frequency": "50.02 Hz",
        "power_factor": "0.94 PF",
        "peak_load": f"{round(64.5 * scale, 1)} kW",
        "load_distribution": "72% Active",
        "daily_load": analytics_daily,
        "weekly_load": analytics_weekly,
        "monthly_load": analytics_monthly,
        "rankings": {
            "highestConsuming": highest_consuming,
            "lowestConsuming": lowest_consuming,
            "highestSavings": highest_savings
        }
    }


class PredictionInput(BaseModel):
    hostel_id: str
    floor_no: int
    wing: str
    room_no: int
    room_capacity: int
    students_present: int
    students_outside: int
    students_on_leave: int
    is_weekend: int
    is_holiday: int
    hour_of_day: int
    temperature: float
    expected_energy_kwh: float
    actual_energy_kwh: float
    room_status: str
    timestamp: str


@router.post("/predict")
def predict_anomaly(payload: PredictionInput, request: Request):
    """
    Exposes real-time room energy classification predictions.
    Uses the loaded joblib model payload from startup.
    """
    model_payload = getattr(request.app.state, "model_payload", None)
    if not model_payload:
        raise HTTPException(
            status_code=503, 
            detail="Machine learning prediction model is offline or not loaded."
        )
        
    try:
        # Preprocess features to match the exact list features_cols
        # features_cols = [
        #   'floor_no', 'room_no', 'room_capacity', 'students_present', 'students_outside',
        #   'students_on_leave', 'is_weekend', 'is_holiday', 'hour_of_day', 'temperature',
        #   'expected_energy_kwh', 'actual_energy_kwh', 'energy_difference',
        #   'hostel_id_encoded', 'wing_encoded', 'room_status_encoded', 'month', 'day', 'day_of_week_encoded'
        # ]
        
        # 1. Parse timestamp (expected format: "YYYY-MM-DD HH:MM")
        try:
            dt = datetime.strptime(payload.timestamp, "%Y-%m-%d %H:%M")
        except ValueError:
            # Fallback format check
            dt = datetime.strptime(payload.timestamp.split("T")[0] + " " + payload.timestamp.split("T")[1][:5], "%Y-%m-%d %H:%M")

        month = dt.month
        day = dt.day
        day_of_week_encoded = dt.weekday()
        
        # 2. Map categoricals
        hostel_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
        wing_map = {'A': 0, 'B': 1, 'Wing A': 0, 'Wing B': 1}
        status_map = {'Occupied': 1, 'Empty': 0}
        
        hostel_id_encoded = hostel_map.get(payload.hostel_id, 0)
        wing_encoded = wing_map.get(payload.wing, 0)
        room_status_encoded = status_map.get(payload.room_status, 0)
        
        energy_difference = payload.actual_energy_kwh - payload.expected_energy_kwh
        
        # 3. Create input vector matching the exact order
        input_data = pd.DataFrame([{
            'floor_no': payload.floor_no,
            'room_no': payload.room_no,
            'room_capacity': payload.room_capacity,
            'students_present': payload.students_present,
            'students_outside': payload.students_outside,
            'students_on_leave': payload.students_on_leave,
            'is_weekend': int(payload.is_weekend),
            'is_holiday': int(payload.is_holiday),
            'hour_of_day': payload.hour_of_day,
            'temperature': payload.temperature,
            'expected_energy_kwh': payload.expected_energy_kwh,
            'actual_energy_kwh': payload.actual_energy_kwh,
            'energy_difference': energy_difference,
            'hostel_id_encoded': hostel_id_encoded,
            'wing_encoded': wing_encoded,
            'room_status_encoded': room_status_encoded,
            'month': month,
            'day': day,
            'day_of_week_encoded': day_of_week_encoded
        }])
        
        # 4. Predict
        model = model_payload["model"]
        scaler = model_payload["scaler"]
        model_name = model_payload["model_name"]
        
        # Scale numerical features if model is Logistic Regression
        if model_name == "Logistic Regression":
            input_scaled = scaler.transform(input_data)
            prediction = model.predict(input_scaled)[0]
            probabilities = model.predict_proba(input_scaled)[0]
        else:
            prediction = model.predict(input_data)[0]
            probabilities = model.predict_proba(input_data)[0]
            
        confidence = float(probabilities[prediction])
        
        # Determine recommendation text
        if prediction == 1:
            rec = "CRITICAL WARNING: Possible electricity wastage detected. Unoccupied/idle room power exceeds baseline."
        else:
            rec = "Normal: Energy consumption parameters are consistent with baseline predictions."
            
        return {
            "prediction": int(prediction),
            "confidence": round(confidence * 100, 2),
            "recommendation": rec,
            "energy_difference": round(energy_difference, 3),
            "model_used": model_name
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")
