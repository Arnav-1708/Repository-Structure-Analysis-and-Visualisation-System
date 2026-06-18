import os
from dataclasses import dataclass
from pathlib import Path

BINARY_EXTENSIONS = [
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".pdf",
    ".zip", ".tar", ".gz", ".exe", ".dll", ".so", ".pyc",
    ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".db",
]

IGNORE_HIDDEN = True


@dataclass
class FileInfo:
    absolute_path: Path
    relative_path: str
    extension: str
    size_bytes: int


def scan_directory(
    root_path: Path,
    ignore_dirs: set[str],
    max_file_size_bytes: int,
) -> list[FileInfo]:
    results: list[FileInfo] = []

    for current_dir, sub_dirs, files in os.walk(root_path):
        sub_dirs[:] = [
            d for d in sub_dirs
            if d not in ignore_dirs and not (IGNORE_HIDDEN and d.startswith("."))
        ]

        for filename in files:
            file_path = Path(current_dir) / filename
            ext = file_path.suffix.lower()

            if ext in BINARY_EXTENSIONS:
                continue

            try:
                size = file_path.stat().st_size
            except OSError:
                continue

            if size > max_file_size_bytes:
                continue

            rel = file_path.relative_to(root_path).as_posix()
            results.append(FileInfo(
                absolute_path=file_path,
                relative_path=rel,
                extension=ext,
                size_bytes=size,
            ))

    return results
