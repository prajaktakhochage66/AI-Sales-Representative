"""
routers/chat.py — Chat API endpoints.
"""

import uuid
from fastapi import APIRouter
from app.schemas import ChatRequest, ChatResponse
from app.ai_service import chat_with_ai

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse, summary="Send a chat message to the AI Sales Rep")
async def send_message(request: ChatRequest):
    """
    Send a message to the WaveNxD AI Sales Representative.

    - **session_id**: Unique ID identifying this chat session (generate one on the frontend)
    - **message**: The user's message text
    - **history**: Previous messages in this session (list of {role, content} objects)

    Returns the AI's reply and whether live AI was available.
    """
    history = [{"role": m.role, "content": m.content} for m in (request.history or [])]
    reply, ai_available = chat_with_ai(request.message, history)

    return ChatResponse(
        reply=reply,
        session_id=request.session_id,
        ai_available=ai_available,
    )


@router.get("/new-session", summary="Generate a new session ID")
async def new_session():
    """Returns a fresh session ID for starting a new conversation."""
    return {"session_id": str(uuid.uuid4())}
