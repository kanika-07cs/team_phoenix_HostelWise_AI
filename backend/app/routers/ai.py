from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.core.database import get_db
from app.routers.dependencies import get_current_active_user
from app.models import database as models
from app.core.config import settings
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_assistant(
    payload: ChatRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Handles context-aware conversation with a local Ollama instance.
    Gathers active hostel energy/occupancy stats and builds a smart audit prompt.
    """
    is_supervisor = current_user.role.name == "supervisor"
    hostel_id = current_user.assigned_hostel_id if is_supervisor else None
    
    # Fetch hostel context from database
    hostel_name = "All Hostels (College Campus)"
    total_rooms = 0
    occupied_rooms = 0
    students_present = 0
    students_outside = 0
    students_leave = 0
    
    if is_supervisor and hostel_id:
        hostel = db.query(models.Hostel).filter(models.Hostel.id == hostel_id).first()
        if hostel:
            hostel_name = hostel.name
            # Count total rooms
            total_rooms = db.query(func.count(models.Room.id))\
                .join(models.Wing).join(models.Floor)\
                .filter(models.Floor.hostel_id == hostel_id).scalar() or 0
                
            # Count occupied rooms
            occupied_rooms = db.query(func.count(models.Room.id))\
                .join(models.Wing).join(models.Floor)\
                .filter(models.Floor.hostel_id == hostel_id)\
                .filter(models.Room.status == "occupied").scalar() or 0
                
            # Count students by status
            students_present = db.query(func.count(models.Student.id))\
                .join(models.StudentRoomAllocation)\
                .join(models.Room).join(models.Wing).join(models.Floor)\
                .filter(models.Floor.hostel_id == hostel_id)\
                .filter(models.Student.status == "present").scalar() or 0
                
            students_outside = db.query(func.count(models.Student.id))\
                .join(models.StudentRoomAllocation)\
                .join(models.Room).join(models.Wing).join(models.Floor)\
                .filter(models.Floor.hostel_id == hostel_id)\
                .filter(models.Student.status == "outside").scalar() or 0
                
            students_leave = db.query(func.count(models.Student.id))\
                .join(models.StudentRoomAllocation)\
                .join(models.Room).join(models.Wing).join(models.Floor)\
                .filter(models.Floor.hostel_id == hostel_id)\
                .filter(models.Student.status == "leave").scalar() or 0
    else:
        # Admin global aggregates
        total_rooms = db.query(func.count(models.Room.id)).scalar() or 0
        occupied_rooms = db.query(func.count(models.Room.id)).filter(models.Room.status == "occupied").scalar() or 0
        students_present = db.query(func.count(models.Student.id)).filter(models.Student.status == "present").scalar() or 0
        students_outside = db.query(func.count(models.Student.id)).filter(models.Student.status == "outside").scalar() or 0
        students_leave = db.query(func.count(models.Student.id)).filter(models.Student.status == "leave").scalar() or 0

    total_students = students_present + students_outside + students_leave

    # Build prompt with rich database context
    context_prompt = (
        f"You are HostelWise AI, a smart campus energy management assistant.\n"
        f"Context for the logged-in user:\n"
        f"- Role: {current_user.role.name.upper()}\n"
        f"- Scope Hostel: {hostel_name}\n"
        f"- Total Rooms in Scope: {total_rooms}\n"
        f"- Occupied Rooms: {occupied_rooms}\n"
        f"- Total Students: {total_students} (Present: {students_present}, Outside: {students_outside}, On Leave: {students_leave})\n\n"
        f"Provide concise, practical, and highly professional advice. Focus on reducing power factor losses, optimizing air conditioning/lighting schedules, and addressing leave check-outs.\n"
        f"User asks: {payload.message}\n"
        f"Answer:"
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": context_prompt,
                    "stream": False
                },
                timeout=120.0
            )
            if response.status_code != 200:
                try:
                    err_msg = response.json().get("error", response.text)
                except Exception:
                    err_msg = response.text
                raise HTTPException(
                    status_code=502,
                    detail=f"Ollama error ({response.status_code}): {err_msg}"
                )
                
            result = response.json()
            ai_text = result.get("response", "No response generated by the local model.")
            return {"response": ai_text, "model": settings.OLLAMA_MODEL}
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Could not connect to Ollama local instance at {settings.OLLAMA_URL}. "
                "Ensure Ollama is installed and running (`ollama serve`) on your local machine."
            )
        )
