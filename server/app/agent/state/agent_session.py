import uuid
import time
from app.agent.state.agent_state import AgentState

_store: dict[str, AgentState] = {}

SESSION_TTL = 3600
_session_created: dict[str, float] = {}

def get_session(session_id: str | None, user_id: str, role: str) -> AgentState:
    if session_id and session_id in _store:
        s = _store[session_id]
        # update user/role in case token changed
        s.user_id = str(user_id)
        s.role = role
        return s
    sid = session_id or str(uuid.uuid4())
    if sid not in _store:
        _store[sid] = AgentState(session_id=sid, user_id=str(user_id), role=role)
        _session_created[sid] = time.time()
    return _store[sid]

def clear_expired():
    now = time.time()
    for sid, ts in list(_session_created.items()):
        if now - ts > SESSION_TTL:
            _store.pop(sid, None)
            _session_created.pop(sid, None)

def save_session(state: AgentState):
    _store[state.session_id] = state
