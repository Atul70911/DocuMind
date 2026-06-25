from fastapi import FastAPI
from app.api import embed, chat, transcribe, parse
from app.core.logger import logger
import httpx
from app.core.config import settings

app = FastAPI(title="DocuMind AI Worker")

app.include_router(embed.router)
app.include_router(chat.router)
app.include_router(transcribe.router)
app.include_router(parse.router)


@app.get("/health")
async def health():
    checks = {"ollama": False}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.ollama_url}/api/tags")
            checks["ollama"] = response.status_code == 200
    except Exception:
        checks["ollama"] = False

    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503

    from fastapi import Response
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=status_code,
        content={"status": "ok" if all_healthy else "degraded", "checks": checks},
    )

@app.on_event("startup")
async def startup():
    logger.info("ai_worker_started")