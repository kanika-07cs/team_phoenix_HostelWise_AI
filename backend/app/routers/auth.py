from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.crud import crud
from app.schemas import schemas
from datetime import timedelta
from app.core.config import settings
from pydantic import BaseModel, EmailStr
from app.models import database as models

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate a username & password. Returns a Bearer JWT Token."""
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
    
    # Create token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(email_struct: schemas.LoginRequest):
    """Placeholder endpoint for forgot password, simulating verification email dispatch."""
    # In production, send a reset email with token link.
    return {"message": f"If an account with email {email_struct.username} exists, a password reset link has been dispatched."}


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    confirm_password: str


@router.post("/register")
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    """Public registration for supervisors. Accounts are created in-active, pending Admin approval."""
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    # Check username
    db_user = crud.get_user_by_username(db, username=payload.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # Check email
    db_email = crud.get_user_by_email(db, email=payload.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Get supervisor role
    supervisor_role = db.query(models.Role).filter(models.Role.name == "supervisor").first()
    if not supervisor_role:
        supervisor_role = models.Role(name="supervisor", description="Supervisor")
        db.add(supervisor_role)
        db.commit()
        db.refresh(supervisor_role)
        
    # Create user as inactive (pending approval)
    from app.core.security import get_password_hash
    new_user = models.User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role_id=supervisor_role.id,
        is_active=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Registration successful. Please wait for an administrator to approve your account before you can log in."}


class GoogleLoginRequest(BaseModel):
    credential: str


@router.post("/google")
def google_authenticate(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Validates Google OAuth ID token. If the user doesn't exist, 
    auto-registers them as an inactive supervisor pending admin approval.
    """
    import httpx
    import secrets
    from app.core.security import get_password_hash
    
    email = None
    name = None
    
    # Check for mock token for local testing/offline validation
    if payload.credential == "mock-google-id-token" or payload.credential.startswith("mock-"):
        email = "google_supervisor@hostelwise.ai"
        name = "Google Supervisor"
    else:
        try:
            # Query Google OAuth tokeninfo endpoint
            response = httpx.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}", timeout=5.0)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Google credential token")
            token_info = response.json()
            email = token_info.get("email")
            name = token_info.get("name", email.split('@')[0])
            if not email:
                raise HTTPException(status_code=400, detail="Google token does not contain email")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google validation failed: {str(e)}")
            
    # Check if user already exists
    user = crud.get_user_by_email(db, email=email)
    
    if not user:
        # Create a new supervisor account as inactive (pending approval)
        supervisor_role = db.query(models.Role).filter(models.Role.name == "supervisor").first()
        if not supervisor_role:
            supervisor_role = models.Role(name="supervisor", description="Supervisor")
            db.add(supervisor_role)
            db.commit()
            db.refresh(supervisor_role)
            
        random_pass = secrets.token_hex(16)
        user = models.User(
            username=email.split('@')[0],
            email=email,
            full_name=name,
            hashed_password=get_password_hash(random_pass),
            role_id=supervisor_role.id,
            is_active=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "is_active": False,
            "message": "Your Google account has been registered. Please wait for an administrator to approve your account."
        }
        
    # User exists
    if not user.is_active:
        return {
            "is_active": False,
            "message": "Your account is pending administrator approval. Please contact your administrator."
        }
        
    # Generate JWT token for active user
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    
    return {
        "is_active": True,
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful"
    }


@router.get("/config")
def get_auth_config():
    """Exposes the Google Client ID configured in the backend's .env file."""
    return {"google_client_id": settings.GOOGLE_CLIENT_ID}
