from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.models.leave import Leave
from app.models.student import Student
from app.schemas.leave import CreateLeaveDto

def _parse_date(s: str) -> date:
    try:
        return date.fromisoformat(s)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid date format, expected YYYY-MM-DD")

def _check_overlap(db: Session, student_id: int, start: date, end: date, exclude_id: int | None = None):
    q = db.query(Leave).filter(Leave.student_id == student_id, Leave.status.in_(["PENDING", "APPROVED"]))
    if exclude_id:
        q = q.filter(Leave.id != exclude_id)
    for lv in q.all():
        s = lv.start_date if isinstance(lv.start_date, date) else date.fromisoformat(str(lv.start_date))
        e = lv.end_date if isinstance(lv.end_date, date) else date.fromisoformat(str(lv.end_date))
        if max(s, start) <= min(e, end):
            raise HTTPException(status_code=409, detail=f"Overlapping leave exists #{lv.id} ({s} to {e})")

def create(db: Session, dto: CreateLeaveDto, requesting_user: dict):
    if requesting_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can apply for leave")
    student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user")
    sd = _parse_date(dto.startDate)
    ed = _parse_date(dto.endDate)
    if ed < sd:
        raise HTTPException(status_code=400, detail="end_date cannot be earlier than start_date")
    if not dto.reason or len(dto.reason.strip()) < 3:
        raise HTTPException(status_code=400, detail="Reason is required")
    _check_overlap(db, student.id, sd, ed)
    lv = Leave(student_id=student.id, start_date=sd, end_date=ed, reason=dto.reason.strip(), status="PENDING")
    db.add(lv)
    db.commit()
    db.refresh(lv)
    return lv

def find_all(db: Session, requesting_user: dict):
    role = requesting_user.get("role")
    if role == "warden" or role == "admin":
        return db.query(Leave).order_by(Leave.created_at.desc()).all()
    student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return db.query(Leave).filter(Leave.student_id == student.id).order_by(Leave.created_at.desc()).all()

def find_one(db: Session, leave_id: int, requesting_user: dict):
    lv = db.query(Leave).filter(Leave.id == leave_id).first()
    if not lv:
        raise HTTPException(status_code=404, detail=f"Leave #{leave_id} not found")
    if requesting_user.get("role") == "student":
        student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
        if not student or lv.student_id != student.id:
            raise HTTPException(status_code=403, detail="You can only view your own leave")
    return lv

def update_status(db: Session, leave_id: int, new_status: str):
    lv = db.query(Leave).filter(Leave.id == leave_id).first()
    if not lv:
        raise HTTPException(status_code=404, detail=f"Leave #{leave_id} not found")
    if lv.status != "PENDING":
        raise HTTPException(status_code=422, detail=f"Leave #{leave_id} is already {lv.status} and cannot be changed")
    if new_status not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")
    lv.status = new_status
    db.commit()
    db.refresh(lv)
    return lv

def cancel(db: Session, leave_id: int, requesting_user: dict):
    lv = db.query(Leave).filter(Leave.id == leave_id).first()
    if not lv:
        raise HTTPException(status_code=404, detail=f"Leave #{leave_id} not found")
    student = db.query(Student).filter(Student.user_id == int(requesting_user.get("sub"))).first()
    if not student or lv.student_id != student.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own leave")
    if lv.status != "PENDING":
        raise HTTPException(status_code=422, detail=f"Leave #{leave_id} is already {lv.status} and cannot be cancelled")
    lv.status = "CANCELLED"
    db.commit()
    db.refresh(lv)
    return lv
