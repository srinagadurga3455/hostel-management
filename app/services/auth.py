from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.student import Student
from app.schemas.auth import RegisterDto, LoginDto
from app.core.security import hash_password, verify_password, create_access_token

def _user_to_dict(user: User, student: Student | None = None) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "student": {
            "id": student.id,
            "roll_number": student.roll_number,
            "branch": student.branch,
            "year": student.year,
            "user_id": student.user_id,
        } if student else None,
    }

def register(db: Session, dto: RegisterDto) -> dict:
    # mirrors auth.service.ts register()
    if dto.role not in ("student", "warden"):
        raise HTTPException(status_code=400, detail='role must be "student" or "warden"')

    if db.query(User).filter(User.email == dto.email).first():
        raise HTTPException(status_code=409, detail="Email already in use")

    if dto.role == "student":
        if not dto.roll_number or not dto.branch or dto.year is None:
            raise HTTPException(status_code=400, detail="rollNumber, branch, and year are required for student registration")
        if db.query(Student).filter(Student.roll_number == dto.roll_number).first():
            raise HTTPException(status_code=409, detail="Roll number already in use")

    hashed = hash_password(dto.password)
    user = User(name=dto.name, email=dto.email, password=hashed, role=dto.role)
    db.add(user)
    db.flush()  # get user.id without commit

    student = None
    if dto.role == "student":
        try:
            student = Student(roll_number=dto.roll_number, branch=dto.branch, year=dto.year, user_id=user.id)
            db.add(student)
            db.flush()
        except IntegrityError as e:
            db.rollback()
            # re-check roll conflict
            if "unique" in str(e).lower() or "roll_number" in str(e).lower():
                raise HTTPException(status_code=409, detail="Roll number already in use") from e
            raise
        except Exception:
            db.rollback()
            # Ensure user not left orphaned - rollback already does
            raise

    db.commit()
    db.refresh(user)
    if student:
        db.refresh(student)

    token = create_access_token(user.id, user.email, user.role)
    return {"token": token, "user": _user_to_dict(user, student)}

def login(db: Session, dto: LoginDto) -> dict:
    user = db.query(User).filter(User.email == dto.email).first()
    if not user or not verify_password(dto.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    student = None
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()

    token = create_access_token(user.id, user.email, user.role)
    return {"token": token, "user": _user_to_dict(user, student)}

def get_me(db: Session, payload: dict) -> dict:
    try:
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    student = None
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()

    return _user_to_dict(user, student)
