from typing import Dict, List
from fastapi import HTTPException, status
from app.models.user import UserRole


class PermissionService:
    
    ROLE_PERMISSIONS: Dict[UserRole, List[str]] = {
        UserRole.VIEWER: ["dashboard:read"],
        UserRole.ANALYST: ["dashboard:read", "analytics:read"],
        UserRole.MANAGER: ["dashboard:read", "analytics:read", "reports:export"],
        UserRole.ADMIN: ["dashboard:read", "analytics:read", "reports:export", "users:manage"]
    }
    
    @classmethod
    def check_permission(cls, user_role: UserRole, required_permission: str) -> bool:
        """Check if user role has required permission"""
        user_permissions = cls.ROLE_PERMISSIONS.get(user_role, [])
        return required_permission in user_permissions
    
    @classmethod
    def require_permission(cls, user_role: UserRole, required_permission: str) -> None:
        """Raise exception if user lacks required permission"""
        if not cls.check_permission(user_role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_permission}"
            )


permission_service = PermissionService()
