STATE_CHANGING = {
    "apply_leave",
    "cancel_leave",
    "create_outing_request",
    "cancel_outing_request",
    "create_complaint",
}

def requires_confirmation(tool_name: str) -> bool:
    return tool_name in STATE_CHANGING

def is_confirmation_message(message: str) -> bool:
    m = message.strip().lower()
    return m in ("yes", "y", "confirm", "yes please", "submit", "proceed", "ok", "okay")

def is_rejection_message(message: str) -> bool:
    m = message.strip().lower()
    return m in ("no", "n", "cancel", "nope", "abort", "stop")
