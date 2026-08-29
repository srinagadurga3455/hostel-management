from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.room import Room
from app.schemas.room import CreateRoomDto, UpdateRoomDto


def create(db: Session, dto: CreateRoomDto):
    existing = db.query(Room).filter(Room.room_number == dto.roomNumber).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Room {dto.roomNumber} already exists")
    room = Room(room_number=dto.roomNumber, block=dto.block, floor=dto.floor, capacity=dto.capacity, occupied=0)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def find_all(db: Session):
    return db.query(Room).all()


def find_one(db: Session, room_id: int):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room #{room_id} not found")
    return room


def update(db: Session, room_id: int, dto: UpdateRoomDto):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room #{room_id} not found")
    data = dto.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(room, k, v)
    db.commit()
    db.refresh(room)
    return room


def remove(db: Session, room_id: int):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room #{room_id} not found")
    db.delete(room)
    db.commit()
    return {"message": f"Room #{room_id} deleted"}
