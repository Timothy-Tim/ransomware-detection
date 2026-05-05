from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel
import secrets
from datetime import datetime, timedelta
from app.core.security import verify_password, create_access_token, decode_token, hash_password
from app.models.user import User
from app.db.session import get_db
from app.core.config import settings
from app.models.setup_token import SetupToken
from app.services.email_service import send_setup_email
from app.models.token_blacklist import TokenBlacklist

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

MAX_FAILED_ATTEMPTS = 5  # lock account after 5 failed attempts


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        # ✅ Check if token is blacklisted
        blacklisted = db.query(TokenBlacklist).filter(
            TokenBlacklist.token == token
        ).first()
        if blacklisted:
            raise HTTPException(status_code=401, detail="Token has been revoked")

        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.active:
            raise HTTPException(status_code=403, detail="Account suspended")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class UserCreate(BaseModel):
    username: str
    full_name: str = ""
    email: str = ""
    password: str = ""
    role: str = "analyst"


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class AdminPasswordReset(BaseModel):
    new_password: str


class CompanyRegister(BaseModel):
    company_name: str
    admin_username: str
    admin_password: str
    admin_full_name: str = ""
    email: str


# ─────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()

    # User not found
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Account suspended
    if not user.active:
        raise HTTPException(status_code=403, detail="Account suspended. Contact your admin.")

    # Account locked due to too many failed attempts
    if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=403,
            detail=f"Account locked after {MAX_FAILED_ATTEMPTS} failed attempts. Contact your admin."
        )

    # Wrong password
    if not verify_password(form_data.password, user.hashed_password):
        user.failed_attempts += 1
        db.commit()
        remaining = MAX_FAILED_ATTEMPTS - user.failed_attempts
        if remaining > 0:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid credentials. {remaining} attempt(s) remaining."
            )
        else:
            raise HTTPException(
                status_code=403,
                detail="Account locked. Contact your admin."
            )

    # Successful login — update tracking fields
    user.failed_attempts = 0
    user.last_login = datetime.now().isoformat()
    user.login_count = (user.login_count or 0) + 1
    db.commit()

    token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
        "force_password_reset": user.force_password_reset
    }


# ─────────────────────────────────────────────
# Token Refresh
# ─────────────────────────────────────────────
@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    token = create_access_token({"sub": current_user.username, "role": current_user.role})
    return {"access_token": token, "token_type": "bearer"}


# ─────────────────────────────────────────────
# Change Password (by user themselves)
# ─────────────────────────────────────────────
@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    current_user.force_password_reset = False  # ✅ clear forced reset flag
    db.commit()
    return {"message": "Password changed successfully"}


# ─────────────────────────────────────────────
# Company Registration (public)
# ─────────────────────────────────────────────
@router.post("/company/register")
async def register_company(
    data: CompanyRegister,
    db: Session = Depends(get_db)
):
    from app.models.company import Company

    existing_company = db.query(Company).filter(Company.name == data.company_name).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="Company name already registered")

    existing_user = db.query(User).filter(User.username == data.admin_username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    existing_email = db.query(Company).filter(Company.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    company = Company(name=data.company_name, email=data.email)
    db.add(company)
    db.flush()

    admin = User(
        username=data.admin_username,
        full_name=data.admin_full_name,
        email=data.email,
        hashed_password=hash_password(data.admin_password),
        role="admin",
        company_id=company.id
    )
    db.add(admin)
    db.commit()
    return {"message": f"Company '{data.company_name}' registered. You can now log in."}


# ─────────────────────────────────────────────
# Create User (admin only)
# ─────────────────────────────────────────────
@router.post("/register")
async def register_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")

    if user_data.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot create another admin account")

    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    if not user_data.email:
        raise HTTPException(status_code=400, detail="Email is required to send setup link")

    # Create user
    user = User(
        username=user_data.username,
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password="",
        role="analyst",
        company_id=current_user.company_id,
        active=False,
        force_password_reset=True
    )
    db.add(user)
    db.flush()  # get user.id before commit

    # Generate one-time setup token
    setup_token = secrets.token_urlsafe(32)
    expires_at = (datetime.now() + timedelta(hours=24)).isoformat()

    setup = SetupToken(
        token=setup_token,
        user_id=user.id,
        expires_at=expires_at
    )
    db.add(setup)
    db.commit()

    # Build setup link using the token
    setup_link = f"{settings.APP_URL}/set-password?token={setup_token}"
    email_sent = send_setup_email(user.email, user.username, setup_link)

    if not email_sent:
        return {
            "message": f"User '{user_data.username}' created but email failed to send. Setup link: {setup_link}"
        }

    return {"message": f"User '{user_data.username}' created. Setup email sent to {user.email}"}



# ─────────────────────────────────────────────
# Verify Setup Token (public)
# ─────────────────────────────────────────────
@router.get("/verify-token/{token}")
async def verify_setup_token(token: str, db: Session = Depends(get_db)):
    setup = db.query(SetupToken).filter(
        SetupToken.token == token,
        SetupToken.used == False
    ).first()

    if not setup:
        raise HTTPException(status_code=400, detail="Invalid or already used token")

    if datetime.now() > datetime.fromisoformat(setup.expires_at):
        raise HTTPException(status_code=400, detail="Token has expired")

    user = db.query(User).filter(User.id == setup.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"username": user.username, "valid": True}


# ─────────────────────────────────────────────
# Set Password via Token (public)
# ─────────────────────────────────────────────
class SetPasswordRequest(BaseModel):
    token: str
    password: str
    confirm_password: str

@router.post("/set-password")
async def set_password(data: SetPasswordRequest, db: Session = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    setup = db.query(SetupToken).filter(
        SetupToken.token == data.token,
        SetupToken.used == False
    ).first()

    if not setup:
        raise HTTPException(status_code=400, detail="Invalid or already used token")

    if datetime.now() > datetime.fromisoformat(setup.expires_at):
        raise HTTPException(status_code=400, detail="Token has expired")

    user = db.query(User).filter(User.id == setup.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Set password and activate account
    user.hashed_password = hash_password(data.password)
    user.active = True
    user.force_password_reset = False

    # Mark token as used
    setup.used = True

    db.commit()
    return {"message": "Password set successfully. You can now log in."}


# ─────────────────────────────────────────────
# Get All Users (admin only)
# ─────────────────────────────────────────────
@router.get("/users")
async def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view users")

    users = db.query(User).filter(User.company_id == current_user.company_id).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "active": u.active,
            "last_login": u.last_login,
            "login_count": u.login_count,
            "failed_attempts": u.failed_attempts,
            "force_password_reset": u.force_password_reset
        }
        for u in users
    ]


# ─────────────────────────────────────────────
# Suspend / Unsuspend User (admin only)
# ─────────────────────────────────────────────
@router.patch("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can suspend users")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot suspend an admin")

    user.active = not user.active  # ✅ toggle suspend/unsuspend
    db.commit()
    status = "suspended" if not user.active else "unsuspended"
    return {"message": f"User '{user.username}' {status}"}


# ─────────────────────────────────────────────
# Reset Failed Attempts / Unlock (admin only)
# ─────────────────────────────────────────────
@router.patch("/users/{user_id}/unlock")
async def unlock_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can unlock users")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.failed_attempts = 0
    db.commit()
    return {"message": f"User '{user.username}' unlocked"}


# ─────────────────────────────────────────────
# Admin Reset Password (admin only)
# ─────────────────────────────────────────────
@router.patch("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: int,
    data: AdminPasswordReset,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reset passwords")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    user.force_password_reset = True  # ✅ force user to change on next login
    user.failed_attempts = 0
    db.commit()
    return {"message": f"Password reset for '{user.username}'. They must change it on next login."}


# ─────────────────────────────────────────────
# Delete User (admin only)
# ─────────────────────────────────────────────
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete an admin account")

    # ✅ Delete setup tokens first before deleting user
    db.query(SetupToken).filter(SetupToken.user_id == user_id).delete()

    db.delete(user)
    db.commit()
    return {"message": f"User '{user.username}' deleted"}