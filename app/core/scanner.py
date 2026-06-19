import os
from dataclasses import dataclass
from pathlib import Path

# stuff we can't really parse anyway - binaries, images, etc
# TODO: maybe add .lock files here too? package-lock.json is annoying
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".pdf",
    ".zip", ".tar", ".gz", ".exe", ".dll", ".so", ".pyc",
    ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".db",
}


@dataclass
class FileInfo:
    absolute_path: Path
    relative_path: str  # posix, relative to repo root - this is what we use as node id
    extension: str
    size_bytes: int


def _should_skip_dir(dir_name: str, ignore_dirs: set[str]) -> bool:
    if dir_name in ignore_dirs:
        return True
    # skip hidden dirs (.git, .idea, .vscode etc) but keep .github so CI configs show up
    if dir_name.startswith(".") and dir_name not in {".github"}:
        return True
    return False


def scan_directory(
    root_path: Path,
    ignore_dirs: set[str],
    max_file_size_bytes: int,
) -> list[FileInfo]:
    results: list[FileInfo] = []

    for current_dir, sub_dirs, files in os.walk(root_path):
        # prune in place so os.walk doesn't go into ignored dirs
        sub_dirs[:] = [d for d in sub_dirs if not _should_skip_dir(d, ignore_dirs)]

        for filename in files:
            file_path = Path(current_dir) / filename
            ext = file_path.suffix.lower()

            if ext in BINARY_EXTENSIONS:
                continue

            try:
                size = file_path.stat().st_size
            except OSError:
                continue  # broken symlink or something, just skip

            if size > max_file_size_bytes:
                continue

            rel = file_path.relative_to(root_path).as_posix()\
            
            results.append(FileInfo(
                absolute_path=file_path,
                relative_path=rel,
                extension=ext,
                size_bytes=size,
            ))

    return results


if __name__ == "__main__":
    # used this to test manually before the API was ready
    import sys
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    files = scan_directory(target, {".git", "node_modules", "venv", "__pycache__"}, 500_000)
    print(f"found {len(files)} files")
    for f in files[:20]:
        print(f"  {f.relative_path} ({f.size_bytes}b)")
