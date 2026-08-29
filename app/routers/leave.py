from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser, WardenUser, StudentUser
from app.schemas.leave import CreateLeaveDto
from app.services import leave as svc

router = APIRouter(prefix="/leaves", tags=["Leaves"])

@router.post("", summary="Apply for leave (student only)")
def create(dto: CreateLeaveDto, db: DbSession, current_user: StudentUser):
    return svc.create(db, dto, current_user)

@router.get("", summary="Get leaves (student: own, warden: all)")
def find_all(db: DbSession, current_user: CurrentUser):
    return svc.find_all(db, current_user)

@router.get("/{leave_id}", summary="Get leave by id")
def find_one(leave_id: int, db: DbSession, current_user: CurrentUser):
    return svc.find_one(db, leave_id, current_user)

@router.patch("/{leave_id}/approve", summary="Approve leave (warden only)")
def approve(leave_id: int, db: DbSession, current_user: WardenUser):
    return svc.update_status(db, leave_id, "APPROVED")

@router.patch("/{leave_id}/reject", summary="Reject leave (warden only)")
def reject(leave_id: int, db: DbSession, current_user: WardenUser):
    return svc.update_status(db, leave_id, "REJECTED")

@router.patch("/{leave_id}/cancel", summary="Cancel leave (student own, pending only)")
def cancel(leave_id: int, db: DbSession, current_user: StudentUser):
    return svc.cancel(db, leave_id, current_user)
