from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.student import Student
from app.models.user import User
from app.schemas.complaint import CreateComplaintDto, UpdateComplaintStatusDto


def create(db: Session, dto: CreateComplaintDto, requesting_user: dict):
    if requesting_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can create complaints")
    student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found for this user")
    comp = Complaint(title=dto.title, description=dto.description, status="PENDING", student_id=student.id)
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp


def find_all(db: Session):
    complaints = db.query(Complaint).all()
    out = []
    for c in complaints:
        student = db.query(Student).filter(Student.id == c.student_id).first()
        safe_user = None
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()
            if user:
                safe_user = {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
        out.append({**{"id": c.id, "title": c.title, "description": c.description, "status": c.status, "student_id": c.student_id}, "student": {**{"id": student.id, "roll_number": student.roll_number}, "user": safe_user} if student else None})
    return out


def find_one(db: Session, comp_id: int):
    c = db.query(Complaint).filter(Complaint.id == comp_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Complaint #{comp_id} not found")
    student = db.query(Student).filter(Student.id == c.student_id).first()
    safe_user = None
    if student:
        user = db.query(User).filter(User.id == student.user_id).first()
        if user:
            safe_user = {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    return {**{"id": c.id, "title": c.title, "description": c.description, "status": c.status, "student_id": c.student_id}, "student": {**{"id": student.id, "roll_number": student.roll_number}, "user": safe_user} if student else None}


def update_status(db: Session, comp_id: int, dto: UpdateComplaintStatusDto):
    c = db.query(Complaint).filter(Complaint.id == comp_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Complaint #{comp_id} not found")
    c.status = dto.status.value if hasattr(dto.status, 'value') else dto.status
    db.commit()
    db.refresh(c)
    return c
