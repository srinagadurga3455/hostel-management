import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

def test_docs():
    r = client.get("/docs")
    assert r.status_code == 200

def test_openapi():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    assert "/api/agent/chat" in r.json()["paths"]
