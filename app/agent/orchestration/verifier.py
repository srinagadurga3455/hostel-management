def verify(tool_name: str, result: dict) -> tuple[bool, str | None]:
    if not result.get("success"):
        return False, result.get("error") or "Operation failed"
    data = result.get("data")
    # Basic checks
    if tool_name in ("get_attendance", "get_attendance_history"):
        if data is None:
            return False, "No attendance data"
    if tool_name == "create_complaint" and not data:
        return False, "Complaint not created"
    if tool_name == "create_outing_request" and not data:
        return False, "Outing not created"
    return True, None
