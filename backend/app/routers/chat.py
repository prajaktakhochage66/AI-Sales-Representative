"""
routers/chat.py — Chat API endpoints.
"""

<<<<<<< HEAD
import asyncio
import json
import uuid
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas import ChatRequest, ChatResponse
from app.ai_service import chat_with_ai, stream_chat_with_ai
=======
import uuid
from fastapi import APIRouter
from app.schemas import ChatRequest, ChatResponse
from app.ai_service import chat_with_ai
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8

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
<<<<<<< HEAD
    reply, ai_available = await asyncio.to_thread(
        chat_with_ai,
        request.message,
        history[-12:],
    )
=======
    reply, ai_available = chat_with_ai(request.message, history)
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8

    return ChatResponse(
        reply=reply,
        session_id=request.session_id,
        ai_available=ai_available,
    )


<<<<<<< HEAD
@router.post("/stream", summary="Stream a chat response as it is generated")
async def stream_message(request: ChatRequest):
    history = [{"role": item.role, "content": item.content} for item in (request.history or [])]

    def events():
        for event in stream_chat_with_ai(request.message, history[-12:]):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


=======
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
@router.get("/new-session", summary="Generate a new session ID")
async def new_session():
    """Returns a fresh session ID for starting a new conversation."""
    return {"session_id": str(uuid.uuid4())}
