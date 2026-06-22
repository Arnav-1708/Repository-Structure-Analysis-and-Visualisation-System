import hashlib
import sqlite3
from contextlib import contextmanager


def compute_content_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


@contextmanager
def _db(path: str):
    conn = sqlite3.connect(path)
    try:
        yield conn
    finally:
        conn.close()


def init_cache_db(db_path: str) -> None:
    with _db(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS summaries (
                relative_path TEXT NOT NULL,
                content_hash  TEXT NOT NULL,
                summary       TEXT NOT NULL,
                created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (relative_path, content_hash)
            )
        """)
        conn.commit()


def get_cached_summary(db_path: str, relative_path: str, content_hash: str) -> str | None:
    with _db(db_path) as conn:
        row = conn.execute(
            "SELECT summary FROM summaries WHERE relative_path = ? AND content_hash = ?",
            (relative_path, content_hash),
        ).fetchone()
        return row[0] if row else None


def set_cached_summary(db_path: str, relative_path: str, content_hash: str, summary: str) -> None:
    with _db(db_path) as conn:
        # delete old entry for this path so cache doesn't accumulate stale rows
        conn.execute("DELETE FROM summaries WHERE relative_path = ?", (relative_path,))
        conn.execute(
            "INSERT INTO summaries (relative_path, content_hash, summary) VALUES (?, ?, ?)",
            (relative_path, content_hash, summary),
        )
        conn.commit()
