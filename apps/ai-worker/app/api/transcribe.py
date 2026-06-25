
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.whisper import transcribe_audio
from app.core.security import verify_internal_key
import httpx

router = APIRouter()


class TranscribeRequest(BaseModel):
    file_url: str  


class TranscribeResponse(BaseModel):
    text: str


@router.post("/transcribe", response_model=TranscribeResponse, dependencies=[Depends(verify_internal_key)])
async def transcribe(request: TranscribeRequest):
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(request.file_url)
        response.raise_for_status()
        audio_bytes = response.content

    text = transcribe_audio(audio_bytes)
    return TranscribeResponse(text=text)