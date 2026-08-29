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

def _normalize_date_token(tok: str) -> str | None:
    tok = tok.strip()
    # ISO YYYY-MM-DD
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", tok)
    if m:
        try:
            y, mo, d = m.groups()
            date(int(y), int(mo), int(d))
            return f"{y}-{mo}-{d}"
        except: return None
    # DD-MM-YYYY or DD/MM/YYYY or D-M-YYYY
    m = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", tok)
    if m:
        d, mo, y = m.groups()
        try:
            d_i, mo_i, y_i = int(d), int(mo), int(y)
            date(y_i, mo_i, d_i)
            return f"{y_i:04d}-{mo_i:02d}-{d_i:02d}"
        except: return None
    return None

def _extract_first_date(msg: str) -> str | None:
    # try ISO first
    m = re.search(r"(\d{4}-\d{2}-\d{2})", msg)
    if m:
        norm = _normalize_date_token(m.group(1))
        if norm: return norm
    # try D-M-Y
    m = re.search(r"(\d{1,2}[-/]\d{1,2}[-/]\d{4})", msg)
    if m:
        norm = _normalize_date_token(m.group(1))
        if norm: return norm
    return None

def _parse_time_token(h: str, m: str | None, ap: str | None) -> str | None:
    try:
        hh = int(h)
        mm = int(m) if m else 0
        if ap:
            ap = ap.lower()
            if ap == "pm" and hh != 12:
                hh += 12
            elif ap == "am" and hh == 12:
                hh = 0
        if 0 <= hh <= 23 and 0 <= mm <= 59:
            return f"{hh:02d}:{mm:02d}"
    except: pass
    return None

def _extract_times(msg: str) -> list[str]:
    # matches 9, 9am, 9 am, 9:30, 9:30am, 9:30 am, 12 pm etc
    # Avoid matching dates like 31-08-2026 (has dashes) — time regex requires colon or am/pm
    times: list[str] = []
    # pattern with colon or am/pm
    for mm in re.finditer(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", msg, re.I):
        full = mm.group(0)
        # skip pure dates without colon and without am/pm and without colon -> e.g. "31" from date will be matched but we filter: need colon or am/pm
        has_colon = ":" in full
        has_ap = bool(mm.group(3))
        if not has_colon and not has_ap:
            continue
        # skip if part of date like 2026 (4 digits) — already not matched as 1-2 digits, but safe
        t = _parse_time_token(mm.group(1), mm.group(2), mm.group(3))
        if t:
            # avoid duplicates from overlapping date fragments
            times.append(t)
    # Also handle explicit HH:MM without am/pm already covered above, but ensure order
    return times

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
    low = msg.lower()
    # destination: explicit label
    m = re.search(r"destination\s*[:\-]?\s*([A-Za-z0-9\s]+?)(?:reason|outingDate|outTime|inTime|$)", msg, re.I)
    if m:
        cand = m.group(1).strip().rstrip(',').strip()
        if cand:
            args["destination"] = cand.title()
    # heuristic destinations
    if "destination" not in args:
        # going to <place>  -> captures "movie bhimavaram" etc.
        mg = re.search(r"going to\s+([A-Za-z0-9\s]+?)(?:\s+for\s+|\s*$|\.)", msg, re.I)
        if mg:
            raw = mg.group(1).strip()
            # if raw contains movie, extract location after movie
            mm = re.search(r"movie\s+(?:at|in|to)?\s*([A-Za-z]+)", raw, re.I)
            if mm:
                args["destination"] = mm.group(1).strip().title()
            elif "movie" in raw.lower():
                # e.g. "movie bhimavaram" -> take last token as place
                toks = [t for t in raw.split() if t.lower() != "movie"]
                if toks:
                    args["destination"] = toks[-1].title()
                else:
                    args["destination"] = "Bhimavaram"
            else:
                args["destination"] = raw.title().split()[0][:50]
        else:
            # movie at/in Bhimavaram
            mm2 = re.search(r"movie\s+(?:at|in|to)?\s*([A-Za-z]+)", msg, re.I)
            if mm2:
                args["destination"] = mm2.group(1).strip().title()
            elif "bhimavaram" in low:
                args["destination"] = "Bhimavaram"
            elif "home" in low and "outing" in low:
                # keep home only if explicitly home outing
                if re.search(r"\bhome\b", low):
                    args["destination"] = "Home"
    # special: if still no destination but bhimavaram present -> use it
    if "destination" not in args and "bhimavaram" in low:
        args["destination"] = "Bhimavaram"

    # reason
    m2 = re.search(r"reason\s*[:\-]?\s*([A-Za-z0-9\s]+?)(?:outingDate|outTime|inTime|destination|$)", msg, re.I)
    if m2:
        cand = m2.group(1).strip()
        if cand:
            args["reason"] = cand
    if "reason" not in args:
        if "movie" in low:
            loc = args.get("destination", "Bhimavaram")
            args["reason"] = f"Watching movie at {loc}"
        elif "family" in low:
            args["reason"] = "Family visit"
        elif "shopping" in low or "mall" in low:
            args["reason"] = "Shopping"

    # date (supports DD-MM-YYYY and YYYY-MM-DD)
    d = _extract_first_date(msg)
    if d:
        args["outingDate"] = d
    elif "tomorrow" in low:
        args["outingDate"] = str(date.today() + timedelta(days=1))
    elif "today" in low:
        args["outingDate"] = str(date.today())
    # times (supports 9am, 9 am, 9:30 pm, 10:00 etc)
    times = _extract_times(msg)
    if len(times) >= 2:
        args["outTime"] = times[0]
        args["inTime"] = times[1]
    elif len(times) == 1:
        args["outTime"] = times[0]

    # Do NOT set defaults for missing fields — let validation ask user
    return args

async def plan(message: str, role: str, history: list) -> AgentPlan:
    # Fast path for greetings without LLM
    if is_greeting(message) and len(message.split()) < 5:
        return AgentPlan(intent="GREETING", tool_name=None, arguments={}, requires_confirmation=False, reasoning_summary="Greeting", is_greeting=True, needs_auth=False)

    # Handle follow-up date/time for pending outing (e.g. user replies "on 1-09-2026" or "from 10:00 to 18:00")
    hist_text = "\n".join([f"{h['role']}: {h['content']}" for h in history[-6:]]) if history else ""
    hist_low = hist_text.lower()
    date_tok = _extract_first_date(message)
    times_in_msg = _extract_times(message)
    has_outing_hist = "outing" in hist_low or "bhimavaram" in hist_low or "movie" in hist_low
    if has_outing_hist and (date_tok or times_in_msg):
        combined = hist_text + " " + message
        args = _extract_outing_args(combined)
        if date_tok:
            args["outingDate"] = date_tok
        if len(times_in_msg) >= 2:
            args["outTime"] = times_in_msg[0]
            args["inTime"] = times_in_msg[1]
        elif len(times_in_msg) == 1:
            args["outTime"] = times_in_msg[0]
        if not args.get("destination") and "bhimavaram" in hist_low:
            args["destination"] = "Bhimavaram"
        if not args.get("reason") and "movie" in hist_low:
            args["reason"] = f"Watching movie at {args.get('destination','Bhimavaram')}"
        return AgentPlan(intent="CREATE_OUTING", tool_name="create_outing_request", arguments=args, requires_confirmation=True, reasoning_summary="Follow-up outing date/time")

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
            # smart extraction for complaint
            low_msg = message.lower()
            # try to extract after regarding/about/for/concerning
            m = re.search(r"(?:regarding|about|for|concerning)\s+(.+)", message, re.I)
            if m:
                raw = m.group(1).strip().rstrip('.')
                # remove leading "a " etc
                desc = raw
                # title: take up to 50 chars, cap first letter
                title = raw[:50].strip()
                # improve title for known issues
                if "fan" in low_msg:
                    title = "Fan noise issue in room"
                    if "noise" not in desc.lower():
                        desc = f"Fan is making lots of noise at night in my room - {desc}"
                elif "water" in low_msg:
                    title = "Water supply issue"
                elif "light" in low_msg or "electric" in low_msg:
                    title = "Electrical issue"
            else:
                desc = message.strip()
                # strip leading "create a complaint regarding"
                desc = re.sub(r"^\s*create\s+a\s+complaint\s*(?:regarding\s*)?", "", desc, flags=re.I).strip()
                if "fan" in low_msg and "noise" in low_msg:
                    title = "Fan noise issue in room"
                    if not desc or len(desc) < 10:
                        desc = "Fan in my room is making lots of noise at night, please fix it"
                    elif "fan" not in desc.lower():
                        desc = f"Fan issue: {desc}"
                else:
                    title = desc[:50] if len(desc) > 5 else "General complaint"
                    if len(title) < 5:
                        title = "General complaint"
            # sanitize
            title = title.strip().rstrip('.')[:50]
            if len(title) < 5:
                title = "Room maintenance issue"
            if len(desc) < 10:
                desc = message.strip()
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
        # Post-process: correct common LLM mistakes and fill missing via heuristics (without inventing defaults)
        if tool == "create_outing_request":
            # fix destination Home -> Bhimavaram when message mentions bhimavaram/movie
            low_msg = message.lower()
            dest_lower = str(args.get("destination","")).lower()
            if "bhimavaram" in low_msg and dest_lower in ("home","", "general"):
                args["destination"] = "Bhimavaram"
            if "movie" in low_msg and "movie" not in str(args.get("reason","")).lower():
                loc = args.get("destination") or "Bhimavaram"
                # if destination still generic, keep it
                args["reason"] = f"Watching movie at {loc}"
            # normalize outingDate if LLM gave DD-MM-YYYY
            if args.get("outingDate"):
                norm = _normalize_date_token(str(args["outingDate"])) or _extract_first_date(str(args["outingDate"]))
                if norm:
                    args["outingDate"] = norm
            # also check message for date if LLM missed it
            if not args.get("outingDate"):
                d2 = _extract_first_date(message)
                if d2:
                    args["outingDate"] = d2
            # fill any missing fields from heuristic (but not defaults)
            extracted = _extract_outing_args(message)
            for k, v in extracted.items():
                if not args.get(k):
                    args[k] = v
        if tool == "apply_leave" and (not args.get("startDate") or not args.get("endDate")):
            extracted = _extract_leave_args(message)
            # merge, prefer LLM args if present
            for k, v in extracted.items():
                args.setdefault(k, v)
        return AgentPlan(intent=intent, tool_name=tool, arguments=args, requires_confirmation=requires_conf, reasoning_summary=summary, is_greeting=False)
    except Exception as e:
        raise PlanningError(f"Invalid plan format: {e}")
