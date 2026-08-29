import re

INJECTION_PATTERNS = [
    r"ignore.*instructions",
    r"system prompt",
    r"reveal.*prompt",
    r"another.*student.*attendance",
    r"give me.*another",
]

def check_safety(message: str, plan_tool: str | None, role: str):
    low = message.lower()
    for pat in INJECTION_PATTERNS:
        if re.search(pat, low):
            # Allow legitimate "another student's attendance" only for warden - but block injection attempts
            if "ignore" in low or "system prompt" in low or "reveal" in low:
                return False, "I can't help with that request. I can help with your own hostel information, attendance, leave, outing, and complaints."
            # For privacy: student asking for another student's data -> check permission later, but warn
            if role.upper() == "STUDENT" and "another" in low and "attendance" in low:
                return False, "I can only show your own attendance. Students cannot access another student's private information."
    return True, ""
