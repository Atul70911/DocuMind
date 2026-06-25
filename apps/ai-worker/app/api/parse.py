# app/api/parse.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.marker import parse_pdf_to_markdown
from app.core.security import verify_internal_key
import httpx

router = APIRouter()


class ParseRequest(BaseModel):
    file_url: str  # signed MinIO URL


class ParseResponse(BaseModel):
    markdown: str


@router.post("/parse", response_model=ParseResponse, dependencies=[Depends(verify_internal_key)])
async def parse(request: ParseRequest):
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(request.file_url)
        response.raise_for_status()
        pdf_bytes = response.content

    markdown = parse_pdf_to_markdown(pdf_bytes)
    return ParseResponse(markdown=markdown)