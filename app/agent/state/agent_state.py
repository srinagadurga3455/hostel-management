from pydantic import BaseModel, Field
from typing import Optional

class AgentState(BaseModel):
    session_id: str
    user_id: str
    role: str
    messages: list = Field(default_factory=list)
    pending_confirmation: Optional[dict] = None
    last_tool: Optional[str] = None
    last_tool_result: Optional[dict] = None
