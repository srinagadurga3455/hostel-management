from pydantic import BaseModel, Field
from typing import Optional

class ToolCall(BaseModel):
    tool_name: str
    arguments: dict = Field(default_factory=dict)

class AgentPlan(BaseModel):
    intent: str
    tool_name: str | None = None
    arguments: dict = Field(default_factory=dict)
    requires_confirmation: bool = False
    reasoning_summary: str | None = None
    is_greeting: bool = False
    needs_auth: bool = True
    multi_tool: bool = False

class ToolResult(BaseModel):
    success: bool
    data: dict | None = None
    message: str | None = None
    error: str | None = None
    status_code: int | None = None

class AgentResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    tool_used: str | None = None
    requires_confirmation: bool = False
    data: dict | None = None
