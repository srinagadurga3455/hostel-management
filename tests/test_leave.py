import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from app.main import app
import uuid
client = TestClient(app)

def get_tokens():
    # ensure warden and student exist
    s = client.post("/api/v1/auth/login", json={"email":"student1@hostel.com","password":"Student@123"})
    w = client.post("/api/v1/auth/login", json={"email":"warden1@hostel.com","password":"Warden@123"})
    return s.json()["token"], w.json()["token"]

def test_leave_create_and_flow():
    stok, wtok = get_tokens()
    # cleanup previous leaves for this student to avoid cross-run overlap
    from app.db.database import SessionLocal
    from app.models.student import Student
    from app.models.leave import Leave
    db = SessionLocal()
    try:
        stu = db.query(Student).filter(Student.user_id == 7).first()  # student1 user_id 7
        if stu:
            db.query(Leave).filter(Leave.student_id == stu.id, Leave.status.in_(["PENDING","APPROVED"])).delete()
            db.commit()
    finally:
        db.close()
    import random
    base_day = random.randint(10, 15)
    start = f"2029-06-{base_day:02d}"
    end = f"2029-06-{base_day+2:02d}"
    overlap_start = f"2029-06-{base_day+1:02d}"
    overlap_end = f"2029-06-{base_day+3:02d}"
    # create
    r = client.post("/api/v1/leaves", headers={"Authorization":f"Bearer {stok}"}, json={"startDate":start,"endDate":end,"reason":"Family function"})
    assert r.status_code == 200, r.text
    lid = r.json()["id"]
    # duplicate overlap should 409
    r2 = client.post("/api/v1/leaves", headers={"Authorization":f"Bearer {stok}"}, json={"startDate":overlap_start,"endDate":overlap_end,"reason":"Overlap"})
    assert r2.status_code == 409
    # invalid dates
    r3 = client.post("/api/v1/leaves", headers={"Authorization":f"Bearer {stok}"}, json={"startDate":"2026-12-28","endDate":"2026-12-20","reason":"Invalid"})
    assert r3.status_code == 400
    # warden cannot create
    r4 = client.post("/api/v1/leaves", headers={"Authorization":f"Bearer {wtok}"}, json={"startDate":"2026-09-20","endDate":"2026-09-21","reason":"Test"})
    assert r4.status_code == 403
    # student view own
    r5 = client.get("/api/v1/leaves", headers={"Authorization":f"Bearer {stok}"})
    assert r5.status_code == 200
    # warden view all
    r6 = client.get("/api/v1/leaves", headers={"Authorization":f"Bearer {wtok}"})
    assert r6.status_code == 200
    # get one
    r7 = client.get(f"/api/v1/leaves/{lid}", headers={"Authorization":f"Bearer {stok}"})
    assert r7.status_code == 200
    # another student cannot view
    email = f"tmp_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/v1/auth/register", json={"name":"Tmp","email":email,"password":"Test@123","role":"student","rollNumber":f"CS9{uuid.uuid4().hex[:5]}","branch":"CSE","year":1})
    tok2 = client.post("/api/v1/auth/login", json={"email":email,"password":"Test@123"}).json()["token"]
    r8 = client.get(f"/api/v1/leaves/{lid}", headers={"Authorization":f"Bearer {tok2}"})
    assert r8.status_code == 403
    # warden approve
    r9 = client.patch(f"/api/v1/leaves/{lid}/approve", headers={"Authorization":f"Bearer {wtok}"})
    assert r9.status_code == 200
    assert r9.json()["status"] == "APPROVED"
    # cannot approve again
    r10 = client.patch(f"/api/v1/leaves/{lid}/approve", headers={"Authorization":f"Bearer {wtok}"})
    assert r10.status_code == 422
    # student cannot approve
    r11 = client.patch(f"/api/v1/leaves/{lid}/approve", headers={"Authorization":f"Bearer {stok}"})
    assert r11.status_code == 403
    # student cannot cancel approved
    r12 = client.patch(f"/api/v1/leaves/{lid}/cancel", headers={"Authorization":f"Bearer {stok}"})
    assert r12.status_code == 422

def test_leave_cancel_pending():
    stok,_ = get_tokens()
    # ensure clean
    from app.db.database import SessionLocal
    from app.models.student import Student
    from app.models.leave import Leave
    db = SessionLocal()
    try:
        stu = db.query(Student).filter(Student.user_id == 7).first()
        if stu:
            db.query(Leave).filter(Leave.student_id == stu.id, Leave.start_date == "2029-10-01").delete()
            db.commit()
    finally:
        db.close()
    r = client.post("/api/v1/leaves", headers={"Authorization":f"Bearer {stok}"}, json={"startDate":"2029-10-01","endDate":"2029-10-02","reason":"Test cancel"})
    assert r.status_code == 200
    lid = r.json()["id"]
    r2 = client.patch(f"/api/v1/leaves/{lid}/cancel", headers={"Authorization":f"Bearer {stok}"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "CANCELLED"
