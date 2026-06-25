from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.ollama import chat_completion_stream
from app.core.security import verify_internal_key

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat", dependencies=[Depends(verify_internal_key)])
async def chat(request: ChatRequest):
    async def event_stream():
        async for chunk in chat_completion_stream(
            [m.model_dump() for m in request.messages]
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")