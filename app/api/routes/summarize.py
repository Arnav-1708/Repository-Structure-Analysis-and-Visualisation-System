from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.cache import compute_content_hash, get_cached_summary, set_cached_summary
from app.core.config import get_settings
from app.services.ai_service import AISummaryError, summarize_file

router = APIRouter()


class SummarizeRequest(BaseModel):
    root_path: str
    relative_path: str


class SummarizeResponse(BaseModel):
    relative_path: str
    summary: str
    cached: bool


@router.post("/api/summarize", response_model=SummarizeResponse)
def summarize(payload: SummarizeRequest):
    file_path = (Path(payload.root_path).expanduser().resolve() / payload.relative_path).resolve()

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="file not found")

    try:
        code = file_path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        raise HTTPException(status_code=400, detail="couldn't read file as text")

    settings = get_settings()
    h = compute_content_hash(code)

    cached = get_cached_summary(settings.cache_db_path, payload.relative_path, h)
    if cached is not None:
        return SummarizeResponse(relative_path=payload.relative_path, summary=cached, cached=True)

    try:
        summary = summarize_file(
            code_text=code,
            filename=file_path.name,
            api_key=settings.gemini_api_key,
            model_name=settings.gemini_model,
            max_chars=settings.ai_summary_max_chars,
        )
    except AISummaryError as e:
        raise HTTPException(status_code=502, detail=str(e))

    set_cached_summary(settings.cache_db_path, payload.relative_path, h, summary)
    return SummarizeResponse(relative_path=payload.relative_path, summary=summary, cached=False)
