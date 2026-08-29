import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def test_register_and_login():
    # Use unique email
    import uuid
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    r = client.post("/api/v1/auth/register", json={"name":"Test","email":email,"password":"Test@123","role":"warden"})
    assert r.status_code in (200,201)
    r2 = client.post("/api/v1/auth/login", json={"email":email,"password":"Test@123"})
    assert r2.status_code == 200
    assert "token" in r2.json()

def test_login_wrong_password():
    r = client.post("/api/v1/auth/login", json={"email":"student1@hostel.com","password":"WrongPass123"})
    assert r.status_code == 401

def test_auth_required():
    r = client.get("/api/v1/users/me")
    assert r.status_code in (401,403)
