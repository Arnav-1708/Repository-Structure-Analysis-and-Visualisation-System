from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import scan
from app.core.config import get_settings

app = FastAPI(title="Repository Structure Analysis and Visualisation System")

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
