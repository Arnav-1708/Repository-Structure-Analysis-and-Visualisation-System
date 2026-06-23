from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import scan, summarize
from app.core.cache import init_cache_db
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_cache_db(get_settings().cache_db_path)
    yield


app = FastAPI(title="Repository Structure Analysis and Visualisation System", lifespan=lifespan)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(summarize.router)


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    # don't leak raw tracebacks to the client
    return JSONResponse(status_code=500, content={"detail": "internal server error"})


@app.get("/api/health")
def health():
    return {"status": "ok"}
