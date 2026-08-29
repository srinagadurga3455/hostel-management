from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser, WardenUser, StudentUser
from app.schemas.complaint import CreateComplaintDto, UpdateComplaintStatusDto
from app.services import complaints as svc

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", summary="Create a complaint (student only)")
def create(dto: CreateComplaintDto, db: DbSession, current_user: StudentUser):
    return svc.create(db, dto, current_user)


@router.get("", summary="Get all complaints (warden only)")
def find_all(db: DbSession, current_user: WardenUser):
    return svc.find_all(db)


@router.get("/{comp_id}", summary="Get a complaint by ID (warden only)")
def find_one(comp_id: int, db: DbSession, current_user: WardenUser):
    return svc.find_one(db, comp_id)


@router.patch("/{comp_id}", summary="Update complaint status (warden only)")
def update_status(comp_id: int, dto: UpdateComplaintStatusDto, db: DbSession, current_user: WardenUser):
    return svc.update_status(db, comp_id, dto)
