from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.dependencies import RoleChecker, get_current_active_user
from app.models import database as models
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])

# Auth dependencies
admin_only = Depends(RoleChecker(["super_admin"]))

@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(current_user: models.User = Depends(get_current_active_user)):
    """Fetch profile information for the currently authenticated user."""
    # Map role name to response schema custom property
    response = schemas.UserResponse.from_orm(current_user)
    response.role_name = current_user.role.name
    if current_user.assigned_hostel:
        response.assigned_hostel_name = current_user.assigned_hostel.name
    return response


@router.post("/", response_model=schemas.UserResponse, dependencies=[admin_only])
def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new supervisor or admin user. (Restricted to Super Admin)"""
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    db_email = crud.get_user_by_email(db, email=user.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    created_user = crud.create_user(db=db, user=user)
    # Fetch role name
    role = db.query(models.Role).filter(models.Role.id == created_user.role_id).first()
    res = schemas.UserResponse.from_orm(created_user)
    res.role_name = role.name if role else "unknown"
    return res


@router.get("/", response_model=List[schemas.UserResponse], dependencies=[admin_only])
def read_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all registered users. (Restricted to Super Admin)"""
    users = crud.get_users(db, skip=skip, limit=limit)
    response_list = []
    for user in users:
        res = schemas.UserResponse.from_orm(user)
        res.role_name = user.role.name
        response_list.append(res)
    return response_list


@router.put("/{user_id}", response_model=schemas.UserResponse, dependencies=[admin_only])
def update_user_details(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    """Modify user settings, update password, or reassign hostel. (Restricted to Super Admin)"""
    updated_user = crud.update_user(db=db, user_id=user_id, user_update=user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    res = schemas.UserResponse.from_orm(updated_user)
    res.role_name = updated_user.role.name
    return res


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[admin_only])
def remove_user(user_id: int, db: Session = Depends(get_db)):
    """Permanently delete a user account. (Restricted to Super Admin)"""
    success = crud.delete_user(db=db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
