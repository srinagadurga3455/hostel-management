import re
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.core.config import settings

ph = PasswordHasher()

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False

def _parse_expires_in(exp: str) -> timedelta:
    """Parse strings like 7d, 12h, 30m, 45s to timedelta. Fallback to 7 days."""
    m = re.match(r"^\s*(\d+)\s*([smhd])\s*$", exp, re.IGNORECASE)
    if not m:
        return timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    val, unit = int(m.group(1)), m.group(2).lower()
    if unit == "s":
        return timedelta(seconds=val)
    if unit == "m":
        return timedelta(minutes=val)
    if unit == "h":
        return timedelta(hours=val)
    if unit == "d":
        return timedelta(days=val)
    return timedelta(days=7)

def create_access_token(sub: int, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + _parse_expires_in(settings.JWT_EXPIRES_IN)
    payload = {"sub": str(sub), "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError(str(e)) from e
