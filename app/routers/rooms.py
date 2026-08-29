from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser, WardenUser
from app.schemas.room import CreateRoomDto, UpdateRoomDto
from app.services import rooms as svc

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.post("", summary="Create a room (warden only)")
def create(dto: CreateRoomDto, db: DbSession, current_user: WardenUser):
    return svc.create(db, dto)


@router.get("", summary="List of all rooms")
def find_all(db: DbSession, current_user: CurrentUser):
    return svc.find_all(db)


@router.get("/{room_id}", summary="Room details")
def find_one(room_id: int, db: DbSession, current_user: CurrentUser):
    return svc.find_one(db, room_id)


@router.patch("/{room_id}", summary="Updated room (warden only)")
def update(room_id: int, dto: UpdateRoomDto, db: DbSession, current_user: WardenUser):
    return svc.update(db, room_id, dto)


@router.delete("/{room_id}", summary="Room deleted (warden only)")
def remove(room_id: int, db: DbSession, current_user: WardenUser):
    return svc.remove(db, room_id)
