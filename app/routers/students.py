from fastapi import APIRouter, status, HTTPException
from app.dependencies import DbSession, CurrentUser, WardenUser
from app.schemas.student import AssignRoomDto, UpdateStudentDto, StudentOut
from app.services import students as students_service

router = APIRouter(prefix="/students", tags=["Students"])


# POST /students — warden only (mirrors NestJS: message to use /auth/register)
@router.post("", status_code=status.HTTP_201_CREATED, summary='Use POST /auth/register with role: "student"')
def create(current_user: WardenUser):
    return {"message": 'Use POST /auth/register with role: "student" to create a student'}


# GET /students — warden only
@router.get("", response_model=list[StudentOut], summary="List of all students")
def find_all(db: DbSession, current_user: WardenUser):
    return students_service.find_all(db)


# GET /students/:id — warden or the student themselves
@router.get("/{student_id}", response_model=StudentOut, summary="Student details")
def find_one(student_id: int, db: DbSession, current_user: CurrentUser):
    student = students_service.find_one(db, student_id)
    if current_user.get("role") == "student" and str(student["user_id"]) != str(current_user.get("sub")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own profile")
    return student


# PATCH /students/:id — warden or the student themselves
@router.patch("/{student_id}", response_model=StudentOut, summary="Updated student")
def update(student_id: int, dto: UpdateStudentDto, db: DbSession, current_user: CurrentUser):
    return students_service.update(db, student_id, dto, current_user)


# PATCH /students/:id/room — warden only
@router.patch("/{student_id}/room", response_model=StudentOut, summary="Assign a room to a student")
def assign_room(student_id: int, dto: AssignRoomDto, db: DbSession, current_user: WardenUser):
    return students_service.assign_room(db, student_id, dto)


# DELETE /students/:id — warden only
@router.delete("/{student_id}", summary="Student deleted")
def remove(student_id: int, db: DbSession, current_user: WardenUser):
    return students_service.remove(db, student_id)
