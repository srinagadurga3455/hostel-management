from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser, WardenUser, StudentUser
from app.schemas.complaint import CreateComplaintDto, UpdateComplaintStatusDto, ComplaintOut
from app.services import complaints as svc

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", summary="Create a complaint (student only)", response_model=ComplaintOut)
def create(dto: CreateComplaintDto, db: DbSession, current_user: StudentUser):
    return svc.create(db, dto, current_user)


@router.get("", summary="Get complaints (warden: all, student: own)", response_model=list[ComplaintOut])
def find_all(db: DbSession, current_user: CurrentUser):
    return svc.find_all(db, current_user)


@router.get("/{comp_id}", summary="Get a complaint by ID", response_model=ComplaintOut)
def find_one(comp_id: int, db: DbSession, current_user: CurrentUser):
    return svc.find_one(db, comp_id, current_user)


@router.patch("/{comp_id}", summary="Update complaint status (warden only)", response_model=ComplaintOut)
def update_status(comp_id: int, dto: UpdateComplaintStatusDto, db: DbSession, current_user: WardenUser):
    return svc.update_status(db, comp_id, dto)
