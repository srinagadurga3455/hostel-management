from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser, WardenUser, StudentUser
from app.schemas.outing import CreateOutingDto, OutingOut
from app.services import outings as svc

router = APIRouter(prefix="/outings", tags=["Outings"])


@router.post("", summary="Create an outing request (student only)", response_model=OutingOut)
def create(dto: CreateOutingDto, db: DbSession, current_user: StudentUser):
    return svc.create(db, dto, current_user)


@router.get("", summary="Get outings (warden: all, student: own)", response_model=list[OutingOut])
def find_all(db: DbSession, current_user: CurrentUser):
    return svc.find_all(db, current_user)


@router.get("/{outing_id}", summary="Get a single outing request", response_model=OutingOut)
def find_one(outing_id: int, db: DbSession, current_user: CurrentUser):
    return svc.find_one(db, outing_id, current_user)


@router.patch("/{outing_id}/approve", summary="Approve an outing request (warden only)", response_model=OutingOut)
def approve(outing_id: int, db: DbSession, current_user: WardenUser):
    return svc.update_status(db, outing_id, "Approved")


@router.patch("/{outing_id}/reject", summary="Reject an outing request (warden only)", response_model=OutingOut)
def reject(outing_id: int, db: DbSession, current_user: WardenUser):
    return svc.update_status(db, outing_id, "Rejected")
