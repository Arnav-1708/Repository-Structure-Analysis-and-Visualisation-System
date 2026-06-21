from pathlib import Path

from app.core.parser import ParsedFile, parse_repository
from app.core.scanner import scan_directory
from app.models.schemas import Edge, GraphResponse, Node, NodeMetrics


def _make_node(parsed: ParsedFile, size_bytes: int) -> Node:
    label = parsed.relative_path.split("/")[-1]
    ext = label.split(".")[-1] if "." in label else ""
    return Node(
        id=parsed.relative_path,
        label=label,
        extension=ext,
        metrics=NodeMetrics(
            loc=parsed.code_lines,
            complexity=parsed.complexity,
            size_bytes=size_bytes,
        ),
    )


def build_graph(root_path: Path, ignore_dirs: set[str], max_file_size_bytes: int) -> GraphResponse:
    files = scan_directory(root_path, ignore_dirs, max_file_size_bytes)
    parsed_files = parse_repository(files)

    sizes = {f.relative_path: f.size_bytes for f in files}

    nodes = [_make_node(p, sizes.get(p.relative_path, 0)) for p in parsed_files]

    edges: list[Edge] = []
    seen: set[tuple[str, str]] = set()
    for pf in parsed_files:
        for dep in pf.dependencies:
            key = (pf.relative_path, dep)
            if key in seen:
                continue
            seen.add(key)
            edges.append(Edge(
                id=f"{pf.relative_path}->{dep}",
                source=pf.relative_path,
                target=dep,
            ))

    return GraphResponse(root_path=str(root_path), nodes=nodes, edges=edges)
