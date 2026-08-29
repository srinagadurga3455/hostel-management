import re
from datetime import date, datetime
from app.agent.errors.agent_errors import ValidationError

def _is_valid_date(s: str) -> bool:
    try:
        date.fromisoformat(s)
        return True
    except Exception:
        return False

def validate(tool_name: str, arguments: dict):
    if tool_name == "apply_leave":
        sd = arguments.get("start_date") or arguments.get("startDate")
        ed = arguments.get("end_date") or arguments.get("endDate")
        rs = arguments.get("reason", "")
        if not sd or not ed:
            raise ValidationError("start_date and end_date are required for leave")
        if not _is_valid_date(sd) or not _is_valid_date(ed):
            raise ValidationError("Dates must be YYYY-MM-DD")
        if sd > ed:
            raise ValidationError("The end date cannot be earlier than the start date")
        if not rs or len(rs.strip()) < 3:
            raise ValidationError("Reason is required for leave")
    elif tool_name == "create_outing_request":
        for f in ["destination", "reason", "outingDate", "outTime", "inTime"]:
            if not arguments.get(f):
                raise ValidationError(f"{f} is required for outing request")
        if not _is_valid_date(arguments["outingDate"]):
            raise ValidationError("outingDate must be YYYY-MM-DD")
        if not re.match(r"^\d{2}:\d{2}$", arguments["outTime"]):
            raise ValidationError("outTime must be HH:MM")
        if not re.match(r"^\d{2}:\d{2}$", arguments["inTime"]):
            raise ValidationError("inTime must be HH:MM")
    elif tool_name == "create_complaint":
        if not arguments.get("title") or not arguments.get("description"):
            raise ValidationError("title and description are required for complaint")
    elif tool_name in ("cancel_leave", "cancel_outing_request", "get_complaint_by_id", "get_attendance_by_date"):
        if not arguments:
            raise ValidationError(f"{tool_name} requires an id")
    # no extra validation for read-only
