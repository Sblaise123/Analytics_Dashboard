# main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import random
from enum import Enum

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize FastAPI app
app = FastAPI(title="Analytics Dashboard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Models
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    VIEWER = "viewer"

class User(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.VIEWER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class MetricData(BaseModel):
    name: str
    value: float
    change: float
    change_type: str  # "increase" or "decrease"

class ChartDataPoint(BaseModel):
    date: str
    value: float
    category: Optional[str] = None

class ChartData(BaseModel):
    title: str
    type: str  # "line", "bar", "pie"
    data: List[ChartDataPoint]

class DashboardData(BaseModel):
    metrics: List[MetricData]
    charts: List[ChartData]

class ReportRequest(BaseModel):
    report_type: str
    date_range: Dict[str, str]
    format: str = "json"

# In-memory database (replace with real database in production)
fake_users_db = {
    "admin@example.com": {
        "id": 1,
        "email": "admin@example.com",
        "full_name": "Admin User",
        "role": UserRole.ADMIN,
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # secret
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    "manager@example.com": {
        "id": 2,
        "email": "manager@example.com",
        "full_name": "Manager User",
        "role": UserRole.MANAGER,
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # secret
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    "analyst@example.com": {
        "id": 3,
        "email": "analyst@example.com",
        "full_name": "Data Analyst",
        "role": UserRole.ANALYST,
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # secret
        "is_active": True,
        "created_at": datetime.utcnow()
    }
}

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def authenticate_user(email: str, password: str):
    user = fake_users_db.get(email)
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        user = fake_users_db.get(email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

def check_permission(user: dict, required_role: UserRole):
    role_hierarchy = {
        UserRole.VIEWER: 1,
        UserRole.ANALYST: 2,
        UserRole.MANAGER: 3,
        UserRole.ADMIN: 4
    }
    
    user_level = role_hierarchy.get(user["role"], 0)
    required_level = role_hierarchy.get(required_role, 0)
    
    if user_level < required_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

def generate_sample_data():
    """Generate sample analytics data"""
    # Generate metrics
    metrics = [
        MetricData(name="Total Revenue", value=125000, change=12.5, change_type="increase"),
        MetricData(name="Active Users", value=8439, change=-2.1, change_type="decrease"),
        MetricData(name="Conversion Rate", value=3.42, change=0.8, change_type="increase"),
        MetricData(name="Avg. Order Value", value=89.32, change=5.2, change_type="increase")
    ]
    
    # Generate chart data
    charts = []
    
    # Line chart - Revenue over time
    revenue_data = []
    base_date = datetime.now() - timedelta(days=30)
    for i in range(30):
        date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        value = 4000 + random.randint(-500, 1000)
        revenue_data.append(ChartDataPoint(date=date, value=value))
    
    charts.append(ChartData(
        title="Daily Revenue",
        type="line",
        data=revenue_data
    ))
    
    # Bar chart - Sales by category
    categories = ["Electronics", "Clothing", "Books", "Home & Garden", "Sports"]
    category_data = []
    for category in categories:
        value = random.randint(1000, 5000)
        category_data.append(ChartDataPoint(
            date=datetime.now().strftime("%Y-%m-%d"),
            value=value,
            category=category
        ))
    
    charts.append(ChartData(
        title="Sales by Category",
        type="bar",
        data=category_data
    ))
    
    # Pie chart - User demographics
    demographics = ["18-24", "25-34", "35-44", "45-54", "55+"]
    demo_data = []
    for demo in demographics:
        value = random.randint(500, 2000)
        demo_data.append(ChartDataPoint(
            date=datetime.now().strftime("%Y-%m-%d"),
            value=value,
            category=demo
        ))
    
    charts.append(ChartData(
        title="User Demographics",
        type="pie",
        data=demo_data
    ))
    
    return DashboardData(metrics=metrics, charts=charts)

# API Routes
@app.post("/api/v1/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    if user_data.email in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "id": len(fake_users_db) + 1,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    fake_users_db[user_data.email] = new_user
    
    access_token = create_access_token(data={"sub": user_data.email})
    
    user_response = User(
        id=new_user["id"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        created_at=new_user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/api/v1/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = authenticate_user(user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user_credentials.email})
    
    user_response = User(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.get("/api/v1/auth/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

@app.get("/api/v1/dashboard", response_model=DashboardData)
async def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    # All authenticated users can view dashboard
    return generate_sample_data()

@app.get("/api/v1/analytics/detailed")
async def get_detailed_analytics(current_user: dict = Depends(get_current_user)):
    # Only analysts and above can access detailed analytics
    check_permission(current_user, UserRole.ANALYST)
    
    # Generate more detailed data for analysts
    detailed_data = generate_sample_data()
    
    # Add additional data that only analysts can see
    detailed_metrics = [
        MetricData(name="Customer Lifetime Value", value=245.67, change=8.3, change_type="increase"),
        MetricData(name="Churn Rate", value=5.2, change=-1.1, change_type="decrease"),
        MetricData(name="Cost Per Acquisition", value=23.45, change=2.8, change_type="increase"),
    ]
    
    detailed_data.metrics.extend(detailed_metrics)
    return detailed_data

@app.post("/api/v1/reports/export")
async def export_report(
    report_request: ReportRequest,
    current_user: dict = Depends(get_current_user)
):
    # Only managers and above can export reports
    check_permission(current_user, UserRole.MANAGER)
    
    # Generate sample report data
    report_data = {
        "report_type": report_request.report_type,
        "date_range": report_request.date_range,
        "generated_at": datetime.now().isoformat(),
        "generated_by": current_user["full_name"],
        "data": [
            {"date": "2024-01-01", "revenue": 4500, "orders": 125},
            {"date": "2024-01-02", "revenue": 3800, "orders": 98},
            {"date": "2024-01-03", "revenue": 5200, "orders": 156},
        ]
    }
    
    if report_request.format == "csv":
        # In a real app, you'd generate actual CSV content
        return {"message": "CSV export feature would be implemented here", "data": report_data}
    
    return report_data

@app.get("/api/v1/admin/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    # Only admins can manage users
    check_permission(current_user, UserRole.ADMIN)
    
    users = []
    for user_data in fake_users_db.values():
        users.append(User(
            id=user_data["id"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            is_active=user_data["is_active"],
            created_at=user_data["created_at"]
        ))
    
    return {"users": users}

@app.get("/")
async def root():
    return {"message": "Analytics Dashboard API is running!"}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)