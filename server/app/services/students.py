from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.models.student import Student
from app.models.room import Room
from app.schemas.student import AssignRoomDto, UpdateStudentDto


def _enrich(student: Student) -> dict:
    user = student.user
    room = student.room
    safe_user = None
    if user:
        safe_user = {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    return {
        "id": student.id,
        "roll_number": student.roll_number,
        "branch": student.branch,
        "year": student.year,
        "user_id": student.user_id,
        "room_id": student.room_id,
        "user": safe_user,
        "room": {"id": room.id, "room_number": room.room_number, "block": room.block, "floor": room.floor, "capacity": room.capacity, "occupied": room.occupied} if room else None,
    }


def find_all(db: Session):
    students = db.query(Student).options(selectinload(Student.user), selectinload(Student.room)).all()
    return [_enrich(s) for s in students]


def find_one(db: Session, student_id: int):
    student = db.query(Student).options(selectinload(Student.user), selectinload(Student.room)).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student #{student_id} not found")
    return _enrich(student)


def update(db: Session, student_id: int, dto: UpdateStudentDto, requesting_user: dict):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student #{student_id} not found")

    if requesting_user.get("role") == "student" and str(student.user_id) != str(requesting_user.get("sub")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own profile")

    data = dto.model_dump(exclude_unset=True)
    # map roomId alias handling: pydantic already populates roomId -> roomId
    # we store as room_id
    if "roomId" in data:
        # allow direct room assignment via update as well (not in ref but compatible)
        room_id = data.pop("roomId")
        student.room_id = room_id

    if "branch" in data:
        student.branch = data["branch"]
    if "year" in data:
        student.year = data["year"]

    db.commit()
    db.refresh(student)
    # reload with relationships for enrich
    student = db.query(Student).options(selectinload(Student.user), selectinload(Student.room)).filter(Student.id == student_id).first()
    return _enrich(student)


def remove(db: Session, student_id: int):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student #{student_id} not found")
    # update occupied if needed
    if student.room_id:
        room = db.query(Room).filter(Room.id == student.room_id).first()
        if room:
            # recalc occupied after deletion
            remaining = db.query(Student).filter(Student.room_id == student.room_id, Student.id != student.id).count()
            room.occupied = remaining
    db.delete(student)
    db.commit()
    return {"message": f"Student #{student_id} deleted"}


def assign_room(db: Session, student_id: int, dto: AssignRoomDto):
    # 1. Student must exist
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student #{student_id} not found")

    # 2. Room must exist
    room = db.query(Room).filter(Room.id == dto.roomId).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room #{dto.roomId} not found")

    # 3. Already in this room
    if student.room_id == dto.roomId:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Student #{student_id} is already assigned to room {room.room_number}")

    # 4. Check capacity
    occupants = db.query(Student).filter(Student.room_id == dto.roomId).count()
    if occupants >= room.capacity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Room {room.room_number} is already full")

    # 5. If student was in another room, decrement that room's occupied
    if student.room_id:
        prev_room = db.query(Room).filter(Room.id == student.room_id).first()
        if prev_room:
            prev_occupants = db.query(Student).filter(Student.room_id == student.room_id).count()
            # after moving, count will be -1
            prev_room.occupied = max(0, prev_occupants - 1)

    # 6. Assign new room and bump occupied
    student.room_id = dto.roomId
    room.occupied = occupants + 1

    db.commit()
    # reload with relationships
    student = db.query(Student).options(selectinload(Student.user), selectinload(Student.room)).filter(Student.id == student_id).first()
    return _enrich(student)
