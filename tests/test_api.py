from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_scan_bad_path():
    r = client.post("/api/scan", json={"path": "/definitely/does/not/exist/lol"})
    assert r.status_code == 400


def test_scan_rejects_file(tmp_path):
    f = tmp_path / "not_a_dir.txt"
    f.write_text("hello")
    r = client.post("/api/scan", json={"path": str(f)})
    assert r.status_code == 400


def test_scan_basic(tmp_path: Path):
    (tmp_path / "main.py").write_text("from helper import greet\nprint(greet())\n")
    (tmp_path / "helper.py").write_text("def greet():\n    return 'hi'\n")

    r = client.post("/api/scan", json={"path": str(tmp_path)})
    assert r.status_code == 200

    data = r.json()
    node_ids = {n["id"] for n in data["nodes"]}
    assert node_ids == {"main.py", "helper.py"}

    edges = {(e["source"], e["target"]) for e in data["edges"]}
    assert ("main.py", "helper.py") in edges


def test_summarize_missing_file(tmp_path: Path):
    r = client.post(
        "/api/summarize",
        json={"root_path": str(tmp_path), "relative_path": "ghost.py"},
    )
    assert r.status_code == 404
