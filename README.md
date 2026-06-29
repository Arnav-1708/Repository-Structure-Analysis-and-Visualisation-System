# Repository Structure Analysis and Visualisation System

Understanding a large unfamiliar codebase by browsing folders one by one is slow and gives no real sense of how files actually relate to each other. This tool solves that — point it at any local repository and it scans through all the files, extracts import dependencies by parsing the code without running it, and serves everything as JSON for a React Flow frontend to render as an interactive graph. Every file becomes a draggable node with its lines of code and complexity score visible at a glance, every import becomes a connecting edge, and clicking any node fetches a short plain-English AI summary of what that file does — so you can get oriented in a new codebase in minutes instead of hours.

Backend: Python + FastAPI. The frontend (React + Vite + React Flow) lives on the `frontend` branch.

## How this differs from existing tools

Tools like dependency-cruiser or an IDE's Graph View can show import structure, but they produce static diagrams and don't explain what files actually do. This backend combines two things those tools keep separate:

- **Dependency mapping** — extracts import relationships statically using Python's AST module, so it works on any codebase without executing any code
- **AI-powered explanation** — on-demand 3-sentence summaries of any file via Gemini, with SQLite caching so the same file is never sent to the API twice

Both are exposed through a clean REST API so the frontend can use either independently.

## Features

- Scans any local directory and maps out file structure automatically, skipping binaries, ignored dirs, and oversized files
- Full import-dependency edge resolution for Python files using AST parsing — `import` and `from ... import` both handled, including bare relative imports (`from . import x`) and submodule imports (`from routers import users` correctly resolves to `routers/users.py` not `routers/__init__.py`)
- Other file types (JS, CSS, Markdown etc.) still appear as nodes with accurate LoC and file size, just no edges — per the original project scope
- Per-file metrics: lines of code, complexity score, file size returned on every node
- Complexity score computed by counting branch nodes in the AST (`if`, `for`, `while`, `try`, `with` etc.) — useful for spotting files worth reviewing first
- AI-generated 3-sentence plain-English summary for any file on demand, powered by Gemini
- SQLite cache keyed by SHA-256 hash of file contents — same unchanged file is never sent to Gemini twice; cache auto-invalidates when file content changes
- Global exception handler so raw Python tracebacks never reach the client

## Project structure

```
app/
├── api/routes/         # scan.py, summarize.py — the four endpoints
├── core/               # scanner.py, parser.py, graph_builder.py, cache.py, config.py
├── models/             # pydantic schemas for request/response types
└── services/           # ai_service.py — Gemini wrapper
tests/
requirements.txt
.env.example
```

## Setup

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and fill in your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

Confirm it's up: open `http://localhost:8000/api/health` in a browser.

## Tests

```bash
pytest tests/ -v
```

## API

**POST /api/scan**

Scans a directory and returns the full graph.

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
    { "id": "app/main.py->app/core/config.py",
      "source": "app/main.py", "target": "app/core/config.py" }
  ]
}
```

**GET /api/graph**

Returns the last scan result without re-scanning. Useful when the frontend needs to re-fetch without triggering a full directory walk.

**POST /api/summarize**

Gets a 3-sentence plain-English summary of a file. Checks the SQLite cache first — if the file content hasn't changed since the last summary, returns instantly without calling Gemini.

```json
{ "root_path": "/path/to/repo", "relative_path": "app/main.py" }
```

```json
{ "relative_path": "app/main.py", "summary": "...", "cached": false }
```

The `cached` field tells the frontend whether this came from cache or a fresh Gemini call.

**GET /api/health**

## Common issues

**ModuleNotFoundError on startup** — virtual environment isn't activated or dependencies weren't installed inside it. Run `venv\Scripts\activate` then `pip install -r requirements.txt` again.

**502 on /api/summarize** — Gemini API key is missing or invalid in `.env`. The graph, metrics, and caching all still work without a key — only the AI summary feature is affected.

**CORS error in browser console** — make sure `CORS_ORIGINS` in `.env` includes the frontend's port. The default `http://localhost:5173,http://localhost:3000` is already in `.env.example`.

**pydantic-core build errors during pip install** — Python version is too new for prebuilt wheels (seen on Python 3.14+). Use Python 3.11 or 3.12 instead.

## Assumptions and limitations

- Dependency edges are only resolved for Python files. Other file types appear as nodes with accurate metrics but without resolved edges — this is per the original project scope. Adding JS/TS (`import`) or C/C++ (`#include`) resolution would follow the same AST-based pattern and is a natural next step.

- Complexity is computed by counting branch nodes in the AST, starting at 1. This is a rough approximation of cyclomatic complexity — accurate enough to flag files worth reviewing, but not a formal static analysis metric. The frontend buckets it into low/medium/high for color display; those thresholds are a frontend display choice and can be tuned without any backend changes.

- The cache stores one summary per file path, keyed by content hash. If the same file exists in two different repos it gets separate cache entries. Cache entries for old content are deleted when new content is cached for the same path, so the database doesn't grow unboundedly.

- Designed for local repositories only. There is no remote Git or authentication handling — the backend expects a path to a folder that already exists on the local machine.

- AI summaries require a valid `GEMINI_API_KEY` in `.env`. Without one the graph scan, metrics, `/api/graph`, and caching all work fine — only `/api/summarize` returns a 502.

## Possible extensions

- Dependency edge resolution for JavaScript/TypeScript (`import`) and C/C++ (`#include`) — the parser is modular enough that adding a new language is a matter of writing one new resolution function
- A scan filter option to return only files above a complexity threshold, useful for quick code review triage
- UI input field to choose the scan path interactively instead of hardcoding it in the frontend
- Persisting the last scan result to disk so `/api/graph` survives a server restart