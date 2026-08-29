from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser
from app.schemas.auth import UserOut
from app.services import auth as auth_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut, summary="Returns the current authenticated user")
def get_me(db: DbSession, current_user: CurrentUser):
    return auth_service.get_me(db, current_user)
