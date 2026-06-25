import whisper
import tempfile
import os
from app.core.config import settings
from app.core.logger import logger

_model = None


def get_model():
    global _model
    if _model is None:
        logger.info("loading_whisper_model", size=settings.whisper_model_size)
        _model = whisper.load_model(settings.whisper_model_size)
        logger.info("whisper_model_loaded")
    return _model


def transcribe_audio(audio_bytes: bytes, suffix: str = ".mp3") -> str:
    
    model = get_model()

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path)
        return result["text"].strip()
    finally:
        os.unlink(tmp_path)