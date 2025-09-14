from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.services.auth_service import auth_service
from app.core.database import db_service
from app.models.user import UserRole

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    payload = auth_service.verify_token(credentials.credentials)
    email = payload.get("sub")
    
    user = db_service.get_user_by_email(email)
    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current active user"""
    if not current_user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user