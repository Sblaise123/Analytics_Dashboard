from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.services.auth_service import auth_service
from app.core.database import db_service
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    # Validate password strength
    if not auth_service.validate_password_strength(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters with uppercase, lowercase, and number"
        )
    
    try:
        # Create user
        new_user = db_service.create_user(user_data.model_dump())
        
        # Generate token
        access_token = auth_service.create_access_token(data={"sub": new_user["email"]})
        
        # Create response
        user_response = UserResponse(**new_user)
        return Token(access_token=access_token, user=user_response)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login_user(credentials: UserLogin):
    """Authenticate user and return token"""
    user = db_service.get_user_by_email(credentials.email)
    
    if not user or not auth_service.verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Update last login
    db_service.update_last_login(credentials.email)
    
    # Generate token
    access_token = auth_service.create_access_token(data={"sub": user["email"]})
    
    # Create response
    user_response = UserResponse(**user)
    return Token(access_token=access_token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(**current_user)
