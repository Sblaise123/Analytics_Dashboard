# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
# Update the import path below if 'database.py' is located elsewhere, or create the file if missing.
from app.core.database import init_db
from app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    init_db()
    yield
    # Shutdown
    pass


def create_application() -> FastAPI:
    """Application factory pattern"""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Enterprise Analytics Dashboard API",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    return app

app = create_application()