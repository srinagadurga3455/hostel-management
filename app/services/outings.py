from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.outing import Outing
from app.models.student import Student
from app.schemas.outing import CreateOutingDto


def create(db: Session, dto: CreateOutingDto, requesting_user: dict):
    if requesting_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can create outing requests")
    student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found for this user")
    outing = Outing(
        destination=dto.destination,
        reason=dto.reason,
        outing_date=dto.outingDate,
        out_time=dto.outTime,
        in_time=dto.inTime,
        status="Pending",
        student_id=student.id,
    )
    db.add(outing)
    db.commit()
    db.refresh(outing)
    return outing


def find_all(db: Session, requesting_user: dict):
    if requesting_user.get("role") == "warden":
        return db.query(Outing).all()
    student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    return db.query(Outing).filter(Outing.student_id == student.id).all()


def find_one(db: Session, outing_id: int, requesting_user: dict):
    outing = db.query(Outing).filter(Outing.id == outing_id).first()
    if not outing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Outing #{outing_id} not found")
    if requesting_user.get("role") == "student":
        student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
        if not student or outing.student_id != student.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own outing requests")
    return outing


def update_status(db: Session, outing_id: int, new_status: str):
    outing = db.query(Outing).filter(Outing.id == outing_id).first()
    if not outing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Outing #{outing_id} not found")
    if outing.status != "Pending":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Outing #{outing_id} is already {outing.status} and cannot be changed")
    outing.status = new_status
    db.commit()
    db.refresh(outing)
    return outing
