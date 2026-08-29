from fastapi import APIRouter, status
from app.dependencies import DbSession
from app.schemas.auth import LoginDto, RegisterDto, TokenResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="User registered successfully")
def register(dto: RegisterDto, db: DbSession):
    return auth_service.register(db, dto)

@router.post("/login", response_model=TokenResponse, summary="Returns JWT access token")
def login(dto: LoginDto, db: DbSession):
    return auth_service.login(db, dto)
