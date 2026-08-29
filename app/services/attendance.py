from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.user import User
from app.schemas.attendance import CreateAttendanceDto, UpdateAttendanceDto


def _enrich_many(records, db: Session):
    out = []
    for a in records:
        student = db.query(Student).filter(Student.id == a.student_id).first()
        safe_user = None
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()
            if user:
                safe_user = {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
        out.append({
            "id": a.id,
            "student_id": a.student_id,
            "date": str(a.date) if a.date else None,
            "status": a.status,
            "student": {**{"id": student.id, "roll_number": student.roll_number, "branch": student.branch, "year": student.year, "user_id": student.user_id}, "user": safe_user} if student else None,
        })
    return out


def create(db: Session, dto: CreateAttendanceDto):
    student = db.query(Student).filter(Student.id == dto.studentId).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student #{dto.studentId} not found")
    existing = db.query(Attendance).filter(Attendance.student_id == dto.studentId, Attendance.date == dto.date).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Attendance for student #{dto.studentId} on {dto.date} already exists")
    rec = Attendance(student_id=dto.studentId, date=dto.date, status=dto.status.value if hasattr(dto.status, 'value') else dto.status)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"id": rec.id, "student_id": rec.student_id, "date": str(rec.date), "status": rec.status}


def find_all(db: Session):
    records = db.query(Attendance).all()
    return _enrich_many(records, db)


def find_by_student(db: Session, student_id: int, requesting_user: dict):
    if requesting_user.get("role") == "student":
        student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own attendance")
    target = db.query(Student).filter(Student.id == student_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student #{student_id} not found")
    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    return _enrich_many(records, db)


def update(db: Session, att_id: int, dto: UpdateAttendanceDto):
    rec = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Attendance #{att_id} not found")
    rec.status = dto.status.value if hasattr(dto.status, 'value') else dto.status
    db.commit()
    db.refresh(rec)
    return {"id": rec.id, "student_id": rec.student_id, "date": str(rec.date), "status": rec.status}
