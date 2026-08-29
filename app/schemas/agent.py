from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatDto(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    conversationId: Optional[str] = Field(default=None, alias="conversationId")
    history: Optional[List[ChatHistoryItem]] = Field(default=None)

    model_config = ConfigDict(populate_by_name=True)


class ChatResponse(BaseModel):
    response: str
