# Repository Structure Analysis and Visualisation System

Scans a local repo and maps out file structure + import dependencies, then serves it
as JSON for a React Flow frontend to render as an interactive graph. You can also
click any node to get a short AI summary of that file (via Gemini), which gets cached
locally so you're not burning API credits on the same file over and over.

Backend: Python + FastAPI. Python repos get full dependency edge resolution;
other file types still show up in the graph with LOC counts, just no edges yet.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# add your GEMINI_API_KEY to .env
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

## Tests

```bash
pytest tests/ -v
```

## API

**POST /api/scan**

Scans a directory and returns the graph.

```json
{ "path": "/path/to/some/repo" }
```

Response:
```json
{
  "root_path": "...",
  "nodes": [
    { "id": "app/main.py", "label": "main.py", "extension": "py",
      "metrics": { "loc": 18, "complexity": 1, "size_bytes": 512 } }
  ],
  "edges": [
    { "id": "app/main.py->app/core/config.py", "source": "app/main.py", "target": "app/core/config.py" }
  ]
}
```

**GET /api/graph**

Returns the last scan result without re-scanning.

**POST /api/summarize**

Gets a 3-sentence plain-English summary of a file. Checks cache first.

```json
{ "root_path": "/path/to/repo", "relative_path": "app/main.py" }
```

```json
{ "relative_path": "app/main.py", "summary": "...", "cached": false }
```

**GET /api/health**
