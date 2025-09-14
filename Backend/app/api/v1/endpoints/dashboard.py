from fastapi import APIRouter, Depends
from app.schemas.analytics import DashboardResponse
from app.services.analytics_service import analytics_service
from app.core.permissions import permission_service
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard_data(current_user: dict = Depends(get_current_active_user)):
    """Get dashboard data for current user"""
    permission_service.require_permission(current_user["role"], "dashboard:read")
    
    return analytics_service.get_dashboard_data(current_user["role"].value)