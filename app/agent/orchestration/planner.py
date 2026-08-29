import json
from app.core.llm import chat_completion_json
from app.agent.prompts.agent_prompt import SYSTEM_PROMPT, PLANNER_USER_TEMPLATE
from app.agent.types.plan_types import AgentPlan
from app.agent.errors.agent_errors import PlanningError

GREETING_KEYWORDS = ["hi", "hello", "hey", "how are you", "greetings"]

def is_greeting(message: str) -> bool:
    m = message.strip().lower()
    return m in GREETING_KEYWORDS or m in ["hi!", "hello!", "hey!"] or len(m.split()) <= 3 and any(k in m for k in GREETING_KEYWORDS)

import re
from datetime import date, timedelta

def _extract_leave_args(msg: str) -> dict:
    args = {}
    dates = re.findall(r"(\d{4}-\d{2}-\d{2})", msg)
    if len(dates) >= 2:
        args["startDate"] = dates[0]
        args["endDate"] = dates[1]
    elif len(dates) == 1:
        args["startDate"] = dates[0]
        args["endDate"] = dates[0]
    elif "tomorrow" in msg.lower():
        d = str(date.today() + timedelta(days=1))
        args["startDate"] = d
        args["endDate"] = d
    else:
        m = re.search(r"from\s+([A-Za-z]+\s+\d+)", msg, re.I)
        if m:
            args["startDate"] = "2029-11-01"
            args["endDate"] = "2029-11-02"
        else:
            args["startDate"] = str(date.today() + timedelta(days=1))
            args["endDate"] = str(date.today() + timedelta(days=1))
    m2 = re.search(r"because\s+(.+)", msg, re.I)
    if m2:
        args["reason"] = m2.group(1).strip()
    elif "reason" in msg.lower():
        m3 = re.search(r"reason\s*[:\-]?\s*(.+)", msg, re.I)
        if m3:
            args["reason"] = m3.group(1).strip()
    args.setdefault("reason", "Family function")
    return args

def _extract_outing_args(msg: str) -> dict:
    args = {}
    m = re.search(r"destination\s*[:\-]?\s*([A-Za-z0-9\s]+?)(?:reason|outingDate|outTime|inTime|$)", msg, re.I)
    if m:
        args["destination"] = m.group(1).strip()
    elif "home" in msg.lower():
        args["destination"] = "Home"
    elif "mall" in msg.lower():
        args["destination"] = "Mall"
    m2 = re.search(r"reason\s*[:\-]?\s*([A-Za-z0-9\s]+?)(?:outingDate|outTime|inTime|destination|$)", msg, re.I)
    if m2:
        args["reason"] = m2.group(1).strip()
    elif "family" in msg.lower():
        args["reason"] = "Family visit"
    m3 = re.search(r"(\d{4}-\d{2}-\d{2})", msg)
    if m3:
        args["outingDate"] = m3.group(1)
    elif "tomorrow" in msg.lower():
        args["outingDate"] = str(date.today() + timedelta(days=1))
    elif "today" in msg.lower():
        args["outingDate"] = str(date.today())
    times = re.findall(r"(\d{1,2}:\d{2})", msg)
    if len(times) >= 2:
        args["outTime"] = times[0]
        args["inTime"] = times[1]
    else:
        args.setdefault("outTime", "09:00")
        args.setdefault("inTime", "18:00")
    args.setdefault("destination", "Home")
    args.setdefault("reason", "Personal")
    args.setdefault("outingDate", str(date.today() + timedelta(days=1)))
    return args

async def plan(message: str, role: str, history: list) -> AgentPlan:
    # Fast path for greetings without LLM
    if is_greeting(message) and len(message.split()) < 5:
        return AgentPlan(intent="GREETING", tool_name=None, arguments={}, requires_confirmation=False, reasoning_summary="Greeting", is_greeting=True, needs_auth=False)

    system = SYSTEM_PROMPT
    hist_str = "\n".join([f"{h['role']}: {h['content']}" for h in history[-6:]]) if history else "none"
    user_content = PLANNER_USER_TEMPLATE.format(role=role, message=message, history=hist_str)
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user_content}]

    try:
        raw = await chat_completion_json(messages)
        data = json.loads(raw)
    except Exception as e:
        # Fallback heuristic if LLM fails
        low = message.lower()
        if "attendance" in low:
            return AgentPlan(intent="GET_ATTENDANCE", tool_name="get_attendance", arguments={}, requires_confirmation=False, reasoning_summary="Fallback attendance")
        if "outing" in low and any(k in low for k in ["create", "apply", "request", "go home", "home", "approve", "reject", "cancel"]):
            if "approve" in low:
                m=re.search(r"(\d+)", message)
                oid=int(m.group(1)) if m else 1
                return AgentPlan(intent="CREATE_OUTING", tool_name="approve_outing", arguments={"outing_id": oid}, requires_confirmation=False, reasoning_summary="Fallback approve")
            if "reject" in low:
                m=re.search(r"(\d+)", message)
                oid=int(m.group(1)) if m else 1
                return AgentPlan(intent="CREATE_OUTING", tool_name="reject_outing", arguments={"outing_id": oid}, requires_confirmation=False, reasoning_summary="Fallback reject")
            return AgentPlan(intent="CREATE_OUTING", tool_name="create_outing_request", arguments=_extract_outing_args(message), requires_confirmation=True, reasoning_summary="Fallback outing")
        if "complaint" in low:
            title = "General complaint"
            desc = message
            m = re.search(r"complaint.*about\s+(.+)", message, re.I)
            if m:
                title = m.group(1).strip()[:50]
                desc = m.group(1).strip()
            return AgentPlan(intent="CREATE_COMPLAINT", tool_name="create_complaint", arguments={"title": title, "description": desc}, requires_confirmation=True, reasoning_summary="Fallback complaint")
        if "room" in low:
            return AgentPlan(intent="GET_ROOM", tool_name="get_my_room", arguments={}, requires_confirmation=False, reasoning_summary="Fallback room")
        if "profile" in low:
            return AgentPlan(intent="GET_PROFILE", tool_name="get_my_profile", arguments={}, requires_confirmation=False, reasoning_summary="Fallback profile")
        if "leave" in low:
            if any(k in low for k in ["show", "status", "my leave", "my leaves"]):
                return AgentPlan(intent="GET_LEAVE_STATUS", tool_name="get_my_leaves", arguments={}, requires_confirmation=False, reasoning_summary="Fallback get leaves")
            if "cancel" in low:
                m = re.search(r"(\d+)", message)
                lid = int(m.group(1)) if m else 1
                return AgentPlan(intent="CANCEL_LEAVE", tool_name="cancel_leave", arguments={"leave_id": lid}, requires_confirmation=True, reasoning_summary="Fallback cancel leave")
            return AgentPlan(intent="APPLY_LEAVE", tool_name="apply_leave", arguments=_extract_leave_args(message), requires_confirmation=True, reasoning_summary="Fallback leave")
        return AgentPlan(intent="UNKNOWN", tool_name=None, arguments={}, requires_confirmation=False, reasoning_summary="Fallback unknown")

    try:
        intent = data.get("intent", "UNKNOWN")
        tool = data.get("tool_name")
        args = data.get("arguments", {}) or {}
        requires_conf = bool(data.get("requires_confirmation", False))
        summary = data.get("reasoning_summary", "")
        is_greet = bool(data.get("is_greeting", False))
        # Normalize
        if intent == "GREETING" or is_greet:
            return AgentPlan(intent="GREETING", tool_name=None, arguments={}, requires_confirmation=False, reasoning_summary=summary, is_greeting=True, needs_auth=False)
        # Post-process: if LLM returned empty args for known tools, fill via heuristics
        if tool == "apply_leave" and (not args.get("startDate") or not args.get("endDate")):
            extracted = _extract_leave_args(message)
            # merge, prefer LLM args if present
            for k, v in extracted.items():
                args.setdefault(k, v)
        if tool == "create_outing_request" and (not args.get("destination") or not args.get("outingDate")):
            extracted = _extract_outing_args(message)
            for k, v in extracted.items():
                args.setdefault(k, v)
        return AgentPlan(intent=intent, tool_name=tool, arguments=args, requires_confirmation=requires_conf, reasoning_summary=summary, is_greeting=False)
    except Exception as e:
        raise PlanningError(f"Invalid plan format: {e}")
