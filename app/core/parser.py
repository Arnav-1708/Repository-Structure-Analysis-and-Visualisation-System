import ast
from dataclasses import dataclass, field

from app.core.scanner import FileInfo


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
    code = sum(1 for l in lines if l.strip() and not l.strip().startswith("#"))
    return total, code


def build_module_index(py_files: list[FileInfo]) -> dict[str, str]:
    index: dict[str, str] = {}
    for f in py_files:
        parts = f.relative_path[:-3].split("/")
        if parts[-1] == "__init__":
            parts = parts[:-1]
        mod = ".".join(parts)
        if mod:
            index[mod] = f.relative_path
    return index


def _extract_imports(tree: ast.Module) -> list[str]:
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module and node.level == 0:
                imports.append(node.module)
    return imports


def parse_python_file(file_info: FileInfo, module_index: dict[str, str]) -> ParsedFile:
    try:
        text = file_info.absolute_path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return ParsedFile(file_info.relative_path, 0, 0, parse_error=True)

    total, code = _count_lines(text)

    try:
        tree = ast.parse(text)
    except SyntaxError:
        return ParsedFile(file_info.relative_path, total, code, parse_error=True)

    deps = []
    for mod_name in _extract_imports(tree):
        if mod_name in module_index:
            path = module_index[mod_name]
            if path != file_info.relative_path:
                deps.append(path)

    return ParsedFile(file_info.relative_path, total, code, dependencies=deps)


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
