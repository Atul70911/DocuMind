from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.core.logger import logger

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
   
    global _model
    if _model is None:
        logger.info("loading_embedding_model", model=settings.embedding_model_name)
        _model = SentenceTransformer(settings.embedding_model_name)
        logger.info("embedding_model_loaded")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_model()
    embeddings = model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()