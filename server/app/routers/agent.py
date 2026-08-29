from fastapi import APIRouter
from app.schemas.agent import ChatDto, ChatResponse
from app.services.agent import chat as agent_chat

router = APIRouter(prefix="/agent", tags=["Agent"])


@router.post("/chat", response_model=ChatResponse, summary="Chat with hostel management assistant")
async def chat(body: ChatDto):
    response = await agent_chat(
        message=body.message,
        conversation_id=body.conversationId,
        history=[h.model_dump() for h in body.history] if body.history else None,
    )
    return {"response": response}
