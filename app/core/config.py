from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    ai_summary_max_chars: int = 8000
    cache_db_path: str = "cache.db"
    ignore_dirs: str = "node_modules,venv,.venv,env,__pycache__,dist,build,.git"
    max_file_size_kb: int = 500
    cors_origins: str = "http://localhost:3000"

    @property
    def ignore_dirs_set(self) -> set[str]:
        return {d.strip() for d in self.ignore_dirs.split(",") if d.strip()}

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
