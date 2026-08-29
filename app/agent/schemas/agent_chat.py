from pydantic import BaseModel, Field
from typing import Optional, List

class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: Optional[str] = Field(default=None, alias="session_id", description="Optional session id for confirmation flow")
    model_config = {"populate_by_name": True}

class AgentChatResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    tool_used: str | None = None
    requires_confirmation: bool = False
    data: dict | None = None

class HistoryItem(BaseModel):
    role: str
    content: str
