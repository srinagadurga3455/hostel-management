from pydantic import BaseModel
from typing import Callable, Any

class ToolDefinition(BaseModel):
    name: str
    description: str
    required_role: str | None = None
    input_schema: dict | None = None
    requires_confirmation: bool = False
    model_config = {"arbitrary_types_allowed": True}

class ToolContext(BaseModel):
    user_id: str
    role: str
    token: str | None = None
    session_id: str | None = None
    model_config = {"arbitrary_types_allowed": True}
