from fastapi import APIRouter
from app.api.v1.endpoints import auth, dashboard, analytics, reports

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)


# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "analytics-dashboard-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )