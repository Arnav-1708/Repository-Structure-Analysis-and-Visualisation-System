from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.core.graph_builder import build_graph
from app.models.schemas import GraphResponse, ScanRequest

router = APIRouter()

# store the last scan result so /api/graph can return it without re-walking
_last_graph: GraphResponse | None = None


@router.post("/api/scan", response_model=GraphResponse)
def scan_repo(payload: ScanRequest):
    root = Path(payload.path).expanduser().resolve()

    if not root.exists() or not root.is_dir():
        raise HTTPException(status_code=400, detail="path does not exist or is not a directory")

    settings = get_settings()
    graph = build_graph(
        root_path=root,
        ignore_dirs=settings.ignore_dirs_set,
        max_file_size_bytes=settings.max_file_size_kb * 1024,
    )

    global _last_graph
    _last_graph = graph
    return graph


@router.get("/api/graph", response_model=GraphResponse)
def get_graph():
    if _last_graph is None:
        raise HTTPException(status_code=404, detail="no scan yet - call POST /api/scan first")
    return _last_graph
