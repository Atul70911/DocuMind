from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
import tempfile
import os
from app.core.logger import logger

_converter = None


def get_converter():
    global _converter
    if _converter is None:
        logger.info("loading_marker_models")
        _converter = PdfConverter(artifact_dict=create_model_dict())
        logger.info("marker_models_loaded")
    return _converter


def parse_pdf_to_markdown(pdf_bytes: bytes) -> str:
    converter = get_converter()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        result = converter(tmp_path)
        return result.markdown
    finally:
        os.unlink(tmp_path)