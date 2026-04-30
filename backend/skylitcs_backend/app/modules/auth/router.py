"""
SPRINT 1 — Auth & JWT (Upgraded to PostgreSQL)
=================================================
Full implementation of register, login, refresh, logout, and /me.
Uses PostgreSQL and SQLAlchemy AsyncSession.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Any, Optional
from jose import jwt, JWTError

from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
)
from app.core.config import settings
from app.db.session import get_db
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserCreate, UserUpdate, UserResponse
from app.modules.auth.schemas import Token, AuthResponse

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Simple token blacklist (Still in-memory for this MVP. Real prod would use Redis)
REVOKED_TOKENS: set = set()

# ─────────────────────────────────────────────
# Auth Dependency & DB Helpers
# ─────────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token in REVOKED_TOKENS:
        raise credentials_exc
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise credentials_exc
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user doesn't have enough privileges",
            )
        return user


def get_manager_airport(current_user: User = Depends(get_current_user)) -> Optional[str]:
    """
    Returns the airport_code for managers, None for admins (sees all).
    Raises 403 if a manager account has no airport assigned.
    """
    if current_user.role == UserRole.ADMIN:
        return None
    if current_user.role == UserRole.MANAGER:
        if not current_user.airport_code:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No airport assigned to this manager account",
            )
        return current_user.airport_code
    # Passengers/public have no airport scope
    return None


async def _get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    target_email = email.lower()
    result = await db.execute(select(User).where(User.email == target_email))
    return result.scalars().first()


# ─────────────────────────────────────────────
# REGISTER
# ─────────────────────────────────────────────
@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Create a passenger account in PostgreSQL and return tokens + user profile.
    """
    existing_user = await _get_user_by_email(user_in.email, db)
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail=f"Account with email '{user_in.email}' already exists."
        )

    try:
        db_user = User(
            email=user_in.email.lower(),
            full_name=user_in.full_name,
            password_hash=get_password_hash(user_in.password),
            role=user_in.role,
            is_active=True,
            is_verified=False
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
    except Exception as e:
        if db:
            await db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration crash: {str(e)}")

    return AuthResponse(
        access_token=create_access_token(
            subject=str(db_user.id),
            extra_claims={"role": db_user.role.value, "airport_code": db_user.airport_code},
        ),
        refresh_token=create_refresh_token(subject=str(db_user.id)),
        user={
            "id": str(db_user.id),
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role.value,
            "airport_code": db_user.airport_code,
            "is_active": db_user.is_active,
        }
    )


# ─────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────
@router.post("/login", response_model=AuthResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Exchange email + password for access & refresh JWTs plus user profile.
    """
    user = await _get_user_by_email(form_data.username, db)

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    return AuthResponse(
        access_token=create_access_token(
            subject=str(user.id),
            extra_claims={"role": user.role.value, "airport_code": user.airport_code},
        ),
        refresh_token=create_refresh_token(subject=str(user.id)),
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "airport_code": user.airport_code,
            "is_active": user.is_active,
        }
    )


# ─────────────────────────────────────────────
# REFRESH
# ─────────────────────────────────────────────
@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token_str: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Issue a new access token using a valid refresh token.
    """
    try:
        payload = jwt.decode(refresh_token_str, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        token_type = payload.get("token_type")
        if token_type != "refresh" or not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Expired or malformed refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return Token(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
    )


# ─────────────────────────────────────────────
# LOGOUT
# ─────────────────────────────────────────────
@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)) -> Any:
    """
    Revoke the current access token (adds it to blacklist).
    """
    REVOKED_TOKENS.add(token)
    return {"message": "Successfully logged out. Token revoked."}


# ─────────────────────────────────────────────
# ME — GET current user
# ─────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def read_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Return the authenticated user's profile directly from the DB.
    """
    return current_user


# ─────────────────────────────────────────────
# ME — UPDATE profile
# ─────────────────────────────────────────────
@router.patch("/me", response_model=UserResponse)
async def update_me(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update the authenticated user's full_name or email.
    """
    if update_in.full_name:
        current_user.full_name = update_in.full_name
    
    if update_in.email:
        new_email = update_in.email.lower()
        if new_email != current_user.email:
            existing = await _get_user_by_email(new_email, db)
            if existing:
                raise HTTPException(status_code=409, detail="Email already in use")
        current_user.email = new_email

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ─────────────────────────────────────────────
# CHANGE PASSWORD
# ─────────────────────────────────────────────
@router.post("/me/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Change password — requires current password for verification.
    """
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    current_user.password_hash = get_password_hash(new_password)
    db.add(current_user)
    await db.commit()
    return {"message": "Password updated successfully"}

# ─────────────────────────────────────────────
# RESET PASSWORD (DEMO OVERRIDE)
# ─────────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(
    email: str,
    new_password: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Reset password — for demo purposes, this allows resetting based on email identity.
    """
    user = await _get_user_by_email(email, db)
    if not user:
        raise HTTPException(status_code=404, detail="Email record not found in core matrix")
    
    user.password_hash = get_password_hash(new_password)
    db.add(user)
    await db.commit()
    return {"message": "Access key re-initialized successfully"}
