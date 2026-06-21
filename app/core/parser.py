"""
Parses python files to extract LOC, a rough complexity number, and
which other repo files they import. Uses ast so we're not actually
running any code.

Non-python files still get a LOC count, just no dependency info.
"""

import ast
from dataclasses import dataclass, field

from app.core.scanner import FileInfo

# nodes that add branches - rough stand-in for cyclomatic complexity
# not super accurate but good enough to flag files that are too long
COMPLEXITY_NODES = (ast.If, ast.For, ast.While, ast.Try, ast.ExceptHandler, ast.With, ast.BoolOp)


@dataclass
class ParsedFile:
    relative_path: str
    total_lines: int
    code_lines: int
    complexity: int = 0
    dependencies: list[str] = field(default_factory=list)
    parse_error: bool = False


def _count_lines(text: str) -> tuple[int, int]:
    lines = text.splitlines()
    total = len(lines)
    # code lines = non-empty, non-comment lines
    code = sum(1 for l in lines if l.strip() and not l.strip().startswith("#"))
    return total, code


def build_module_index(py_files: list[FileInfo]) -> dict[str, str]:
    """dotted module name -> relative file path, e.g. 'app.core.scanner' -> 'app/core/scanner.py'"""
    index: dict[str, str] = {}
    for f in py_files:
        parts = f.relative_path[:-3].split("/")
        if parts[-1] == "__init__":
            parts = parts[:-1]
        mod = ".".join(parts)
        if mod:
            index[mod] = f.relative_path
    return index


def _extract_imports(tree: ast.Module) -> list[tuple[str | None, int, list[str]]]:
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append((alias.name, 0, []))
        elif isinstance(node, ast.ImportFrom):
            # node.module is None for bare "from . import x" - don't skip it
            names = [a.name for a in node.names]
            imports.append((node.module, node.level, names))
    return imports


def _resolve_relative(file_path: str, module: str | None, level: int) -> str | None:
    parts = file_path[:-3].split("/")
    package = parts[:-1]

    # level 1 = same package, level 2 = one up, etc
    up = level - 1
    if up > len(package):
        return None
    base = package[: len(package) - up] if up else package

    if module:
        return ".".join(base + module.split("."))
    return ".".join(base) if base else None


def parse_python_file(file_info: FileInfo, module_index: dict[str, str]) -> ParsedFile:
    try:
        text = file_info.absolute_path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return ParsedFile(file_info.relative_path, 0, 0, parse_error=True)

    total, code = _count_lines(text)

    try:
        tree = ast.parse(text)
    except SyntaxError:
        # return the LOC even if ast chokes on it
        return ParsedFile(file_info.relative_path, total, code, parse_error=True)

    complexity = 1 + sum(1 for n in ast.walk(tree) if isinstance(n, COMPLEXITY_NODES))

    deps = []
    for mod_name, level, names in _extract_imports(tree):
        if level > 0:
            resolved = _resolve_relative(file_info.relative_path, mod_name, level)
        else:
            resolved = mod_name

        if not resolved:
            continue

        if names:
            # "from x import a, b" - each name might be a submodule file or just an
            # attribute inside __init__.py, need to check per name not per statement
            # e.g. "from routers import users" -> routers/users.py not routers/__init__.py
            for name in names:
                sub = f"{resolved}.{name}"
                if sub in module_index:
                    path = module_index[sub]
                    if path != file_info.relative_path and path not in deps:
                        deps.append(path)
                elif resolved in module_index:
                    path = module_index[resolved]
                    if path != file_info.relative_path and path not in deps:
                        deps.append(path)
        else:
            # plain "import x.y.z"
            if resolved in module_index:
                path = module_index[resolved]
                if path != file_info.relative_path and path not in deps:
                    deps.append(path)

    return ParsedFile(file_info.relative_path, total, code, complexity, deps)


def parse_repository(files: list[FileInfo]) -> list[ParsedFile]:
    py_files = [f for f in files if f.extension == ".py"]
    module_index = build_module_index(py_files)

    parsed = []
    for f in files:
        if f.extension == ".py":
            parsed.append(parse_python_file(f, module_index))
        else:
            try:
                text = f.absolute_path.read_text(encoding="utf-8")
                total, code = _count_lines(text)
                parsed.append(ParsedFile(f.relative_path, total, code))
            except (UnicodeDecodeError, OSError):
                parsed.append(ParsedFile(f.relative_path, 0, 0, parse_error=True))

    return parsed