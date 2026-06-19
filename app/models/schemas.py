from pydantic import BaseModel


class NodeMetrics(BaseModel):
    loc: int
    complexity: int
    size_bytes: int


class Node(BaseModel):
    id: str          # relative path, used as node id in the graph
    label: str       # just the filename
    extension: str
    metrics: NodeMetrics


class Edge(BaseModel):
    id: str
    source: str
    target: str


class GraphResponse(BaseModel):
    root_path: str
    nodes: list[Node]
    edges: list[Edge]


class ScanRequest(BaseModel):
    path: str
