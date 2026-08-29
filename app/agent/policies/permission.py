from app.agent.errors.agent_errors import PermissionDeniedError

# Permission matrix: tool -> roles allowed
MATRIX: dict[str, list[str]] = {
    "get_attendance": ["STUDENT", "WARDEN", "ADMIN"],
    "get_attendance_history": ["STUDENT", "WARDEN", "ADMIN"],
    "get_attendance_by_date": ["STUDENT", "WARDEN", "ADMIN"],
    "create_complaint": ["STUDENT"],
    "get_my_complaints": ["STUDENT", "WARDEN", "ADMIN"],
    "get_complaint_by_id": ["WARDEN", "ADMIN"],
    "get_complaint_status": ["STUDENT", "WARDEN", "ADMIN"],
    "apply_leave": ["STUDENT"],
    "get_leave_status": ["STUDENT", "WARDEN", "ADMIN"],
    "get_my_leaves": ["STUDENT", "WARDEN", "ADMIN"],
    "cancel_leave": ["STUDENT"],
    "create_outing_request": ["STUDENT"],
    "get_my_outings": ["STUDENT", "WARDEN", "ADMIN"],
    "get_outing_status": ["STUDENT", "WARDEN", "ADMIN"],
    "cancel_outing_request": ["STUDENT"],
    "approve_outing": ["WARDEN", "ADMIN"],
    "reject_outing": ["WARDEN", "ADMIN"],
    "get_my_profile": ["STUDENT", "WARDEN", "ADMIN"],
    "get_my_room": ["STUDENT", "WARDEN", "ADMIN"],
    "get_my_hostel": ["STUDENT", "WARDEN", "ADMIN"],
    "get_my_warden": ["STUDENT", "WARDEN", "ADMIN"],
    "get_room_details": ["STUDENT", "WARDEN", "ADMIN"],
}

def check_permission(tool_name: str, role: str):
    role_up = role.upper()
    allowed = MATRIX.get(tool_name)
    if allowed is None:
        # Unknown tool -> deny
        raise PermissionDeniedError(f"Tool {tool_name} not allowed")
    if role_up not in allowed:
        raise PermissionDeniedError(f"Role {role} not allowed to use {tool_name}")
