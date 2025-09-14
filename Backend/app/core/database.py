from typing import Dict, Optional
from datetime import datetime
from app.models.user import User, UserRole
from app.services.auth_service import auth_service


class DatabaseService:
    """In-memory database simulation - replace with SQLAlchemy in production"""
    
    def __init__(self):
        self.users_db: Dict[str, dict] = {}
        self._create_demo_users()
    
    def _create_demo_users(self) -> None:
        """Create demo users for testing"""
        demo_users = [
            {
                "email": "admin@example.com",
                "password": "secret",
                "full_name": "Admin User",
                "role": UserRole.ADMIN
            },
            {
                "email": "manager@example.com", 
                "password": "secret",
                "full_name": "Manager User",
                "role": UserRole.MANAGER
            },
            {
                "email": "analyst@example.com",
                "password": "secret", 
                "full_name": "Data Analyst",
                "role": UserRole.ANALYST
            },
            {
                "email": "viewer@example.com",
                "password": "secret",
                "full_name": "Viewer User", 
                "role": UserRole.VIEWER
            }
        ]
        
        for i, user_data in enumerate(demo_users, 1):
            self.users_db[user_data["email"]] = {
                "id": i,
                "email": user_data["email"],
                "hashed_password": auth_service.get_password_hash(user_data["password"]),
                "full_name": user_data["full_name"],
                "role": user_data["role"],
                "is_active": True,
                "created_at": datetime.utcnow(),
                "last_login": None
            }
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        return self.users_db.get(email)
    
    def create_user(self, user_data: dict) -> dict:
        """Create new user"""
        if user_data["email"] in self.users_db:
            raise ValueError("Email already registered")
        
        user_id = len(self.users_db) + 1
        new_user = {
            "id": user_id,
            "email": user_data["email"],
            "hashed_password": auth_service.get_password_hash(user_data["password"]),
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "is_active": True,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        
        self.users_db[user_data["email"]] = new_user
        return new_user
    
    def update_last_login(self, email: str) -> None:
        """Update user's last login timestamp"""
        if email in self.users_db:
            self.users_db[email]["last_login"] = datetime.utcnow()


def init_db() -> None:
    """Initialize database"""
    pass 