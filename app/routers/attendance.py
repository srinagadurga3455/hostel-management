from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser, WardenUser
from app.schemas.attendance import CreateAttendanceDto, UpdateAttendanceDto
from app.services import attendance as svc

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("", summary="Mark attendance for a student (warden only)")
def create(dto: CreateAttendanceDto, db: DbSession, current_user: WardenUser):
    return svc.create(db, dto)


@router.get("", summary="Get all attendance records (warden only)")
def find_all(db: DbSession, current_user: WardenUser):
    return svc.find_all(db)


@router.get("/student/{student_id}", summary="Get attendance for a specific student")
def find_by_student(student_id: int, db: DbSession, current_user: CurrentUser):
    return svc.find_by_student(db, student_id, current_user)


@router.patch("/{att_id}", summary="Update an attendance record (warden only)")
def update(att_id: int, dto: UpdateAttendanceDto, db: DbSession, current_user: WardenUser):
    return svc.update(db, att_id, dto)
