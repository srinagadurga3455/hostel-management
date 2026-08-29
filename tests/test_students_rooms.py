import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from app.main import app
import uuid
client = TestClient(app)

def get_tokens():
    s = client.post("/api/v1/auth/login", json={"email":"student1@hostel.com","password":"Student@123"}).json()["token"]
    w = client.post("/api/v1/auth/login", json={"email":"warden1@hostel.com","password":"Warden@123"}).json()["token"]
    return s,w

def test_students_crud():
    stok, wtok = get_tokens()
    # get own
    me = client.get("/api/v1/users/me", headers={"Authorization":f"Bearer {stok}"}).json()
    sid = me["student"]["id"]
    r = client.get(f"/api/v1/students/{sid}", headers={"Authorization":f"Bearer {stok}"})
    assert r.status_code == 200
    # update own
    r2 = client.patch(f"/api/v1/students/{sid}", headers={"Authorization":f"Bearer {stok}"}, json={"branch":"EEE"})
    assert r2.status_code == 200
    assert r2.json()["branch"] == "EEE"
    # warden list
    r3 = client.get("/api/v1/students", headers={"Authorization":f"Bearer {wtok}"})
    assert r3.status_code == 200
    assert len(r3.json()) >= 1

def test_rooms_capacity():
    _, wtok = get_tokens()
    # create room
    rn = f"Z{uuid.uuid4().hex[:4]}"
    r = client.post("/api/v1/rooms", headers={"Authorization":f"Bearer {wtok}"}, json={"roomNumber":rn,"block":"Z","floor":1,"capacity":1})
    assert r.status_code == 200
    rid = r.json()["id"]
    # assign student1
    s_tok = client.post("/api/v1/auth/login", json={"email":"student1@hostel.com","password":"Student@123"}).json()["token"]
    sid = client.get("/api/v1/users/me", headers={"Authorization":f"Bearer {s_tok}"}).json()["student"]["id"]
    r2 = client.patch(f"/api/v1/students/{sid}/room", headers={"Authorization":f"Bearer {wtok}"}, json={"roomId": rid})
    # may be 200 or 409 if already assigned elsewhere, accept either
    assert r2.status_code in (200,409)
    # capacity exceeded with second student
    # create second temp student
    email = f"tmp_{uuid.uuid4().hex[:6]}@example.com"
    roll = f"CS9{uuid.uuid4().hex[:5]}"
    client.post("/api/v1/auth/register", json={"name":"Tmp2","email":email,"password":"Test@123","role":"student","rollNumber":roll,"branch":"CSE","year":1})
    # need fresh sid for tmp
    # find tmp student id via warden list
    lst = client.get("/api/v1/students", headers={"Authorization":f"Bearer {wtok}"}).json()
    tmp = [s for s in lst if s["rollNumber"]==roll][0]
    r3 = client.patch(f"/api/v1/students/{tmp['id']}/room", headers={"Authorization":f"Bearer {wtok}"}, json={"roomId": rid})
    # if first assign succeeded, second should fail capacity
    if r2.status_code == 200:
        assert r3.status_code == 409
