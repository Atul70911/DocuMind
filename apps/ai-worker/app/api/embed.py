from fastapi import APIRouter, Depends
from app.core.security import verify_internal_key
from pydantic import BaseModel
from app.services.embeddings import embed_texts

router = APIRouter()


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]


@router.post("/embed", response_model=EmbedResponse, dependencies=[Depends(verify_internal_key)])
async def embed(request: EmbedRequest):
    embeddings = embed_texts(request.texts)
    return EmbedResponse(embeddings=embeddings)