from fastapi import APIRouter, Depends
from app.schemas.analytics import DashboardResponse
from app.services.analytics_service import analytics_service
from app.core.permissions import permission_service
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/detailed", response_model=DashboardResponse)
async def get_detailed_analytics(current_user: dict = Depends(get_current_active_user)):
    """Get detailed analytics data (Analyst+ only)"""
    permission_service.require_permission(current_user["role"], "analytics:read")
    
    return analytics_service.get_dashboard_data(current_user["role"].value)


# app/api/v1/endpoints/reports.py

from fastapi import APIRouter, Depends
from app.schemas.analytics import ReportRequest
from app.core.permissions import permission_service
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/export")
async def export_report(
    report_request: ReportRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """Export report data (Manager+ only)"""
    permission_service.require_permission(current_user["role"], "reports:export")
    
    # Generate sample report data
    return {
        "message": "Report generated successfully",
        "report_type": report_request.report_type,
        "format": report_request.format,
        "generated_by": current_user["full_name"],
        "data": [
            {"date": "2024-01-01", "revenue": 4500, "orders": 125},
            {"date": "2024-01-02", "revenue": 3800, "orders": 98}
        ]
    }
