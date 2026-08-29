from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import decode_token

# Common dependencies
DbSession = Annotated[Session, Depends(get_db)]

security = HTTPBearer()

def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]) -> dict:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing token")
    if not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing token")
    return payload

CurrentUser = Annotated[dict, Depends(get_current_user)]


def require_warden(current_user: CurrentUser) -> dict:
    if current_user.get("role") != "warden":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Warden role required")
    return current_user


def require_student(current_user: CurrentUser) -> dict:
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student role required")
    return current_user


WardenUser = Annotated[dict, Depends(require_warden)]
StudentUser = Annotated[dict, Depends(require_student)]
