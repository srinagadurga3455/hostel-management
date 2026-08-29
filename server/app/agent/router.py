from fastapi import APIRouter, Depends, Header
from app.agent.schemas.agent_chat import AgentChatRequest, AgentChatResponse
from app.agent.service import handle_chat
from app.dependencies import CurrentUser
# Import tools to register them
import app.agent.tools.attendance.attendance_tools  # noqa
import app.agent.tools.complaints.complaints_tools  # noqa
import app.agent.tools.leave.leave_tools  # noqa
import app.agent.tools.outing.outing_tools  # noqa
import app.agent.tools.user.user_tools  # noqa

router = APIRouter(prefix="/api/agent", tags=["Agent"])

@router.post("/chat", response_model=AgentChatResponse)
async def chat(body: AgentChatRequest, current_user: CurrentUser, authorization: str | None = Header(default=None)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    # also try from CurrentUser dependency, token already validated
    # Use provided header token
    user_id = str(current_user.get("sub"))
    role = current_user.get("role", "STUDENT")
    result = await handle_chat(body.message, body.session_id, user_id, role, token)
    return AgentChatResponse(**result)

@router.get("/health")
def health():
    return {"status": "ok", "agent": "ready"}
