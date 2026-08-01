from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.dependencies import get_current_active_user
from app.models import database as models
from typing import List
import os

router = APIRouter(prefix="/reports", tags=["Reports"])

all_users = Depends(get_current_active_user)

@router.get("/", response_model=List[schemas.ReportResponse], dependencies=[all_users])
def list_generated_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Fetch history list of generated energy & occupancy reports."""
    return crud.get_reports(db, skip=skip, limit=limit)


@router.post("/generate", response_model=schemas.ReportResponse)
def trigger_report_generation(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    """
    Triggers generation of Daily, Weekly, or Monthly energy reports,
    saving the report audit trail record.
    """
    # Verify user exists
    user = crud.get_user(db, user_id=report.generated_by)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Simulate saving a file export (Excel or PDF)
    # Generate mock file path e.g. /exports/reports/daily_report_2026.pdf
    mock_filename = f"{report.name.lower().replace(' ', '_')}_{int(datetime.timestamp(datetime.now()))}.xlsx"
    report.file_path = f"/exports/reports/{mock_filename}"
    
    return crud.create_report_record(db=db, report=report)


@router.get("/{report_id}/download", dependencies=[all_users])
def download_report_file(report_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the report URL file path link.
    """
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report record not found")
        
    return {"name": report.name, "download_url": report.file_path, "type": report.type}
from datetime import datetime
