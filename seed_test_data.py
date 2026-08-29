"""Seed test data via app.db.database → PostgreSQL. Flow: Script → SessionLocal → PostgreSQL"""
from app.db.database import SessionLocal, engine
from app.db.base import Base
from app.services.auth import register, login
from app.schemas.auth import RegisterDto
from sqlalchemy import text

# Ensure tables exist
Base.metadata.create_all(bind=engine)
print("Tables ensured:", [t.name for t in Base.metadata.sorted_tables])

# Clean previous test data
with engine.begin() as conn:
    conn.execute(text("DELETE FROM students WHERE roll_number LIKE 'CS2021%'"))
    conn.execute(text("DELETE FROM users WHERE email IN ('warden1@hostel.com','student1@hostel.com','student2@hostel.com','student3@hostel.com')"))
print("Cleaned old test rows")

test_users = [
    {"name":"Warden One","email":"warden1@hostel.com","password":"Warden@123","role":"warden"},
    {"name":"Alice","email":"student1@hostel.com","password":"Student@123","role":"student","rollNumber":"CS2021001","branch":"CSE","year":2},
    {"name":"Bob","email":"student2@hostel.com","password":"Student@123","role":"student","rollNumber":"CS2021002","branch":"ECE","year":3},
    {"name":"Charlie","email":"student3@hostel.com","password":"Student@123","role":"student","rollNumber":"CS2021003","branch":"ME","year":1},
]

db = SessionLocal()
created = []
try:
    for u in test_users:
        dto = RegisterDto(**u)
        try:
            res = register(db, dto)
            print(f"CREATED {u['role']} {u['email']} id={res['user']['id']} roll={u.get('rollNumber')}")
            created.append(res)
        except Exception as e:
            # parse HTTPException
            detail = getattr(e, 'detail', str(e))
            print(f"SKIP {u['email']}: {detail}")
finally:
    db.close()

# Verify login + get_me flow (Router → Depends(get_db) → Session)
db = SessionLocal()
try:
    for u in test_users:
        try:
            res = login(db, RegisterDto(email=u["email"], password=u["password"], name="x", role=u["role"]))  # use LoginDto compat
        except Exception:
            from app.schemas.auth import LoginDto
            res = login(db, LoginDto(email=u["email"], password=u["password"]))
        token = res["token"][:20]+"..."
        print(f"LOGIN OK {u['email']} token={token} user={res['user']['name']} role={res['user']['role']}")
finally:
    db.close()

# Raw SQL verification
with engine.connect() as c:
    print("\n--- users ---")
    for row in c.execute(text("SELECT id,name,email,role FROM users WHERE email LIKE '%@hostel.com' ORDER BY id")):
        print(row)
    print("\n--- students ---")
    for row in c.execute(text("SELECT id,roll_number,branch,year,user_id FROM students ORDER BY roll_number")):
        print(row)
    print("\n--- join ---")
    for row in c.execute(text("SELECT u.email, s.roll_number, s.branch FROM users u JOIN students s ON s.user_id=u.id ORDER BY s.roll_number")):
        print(row)

print("\nSeed done. Use curl tests below to verify HTTP layer.")
