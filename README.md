# GDSC Frontend — Repository Structure Analysis & Visualisation System

## Description

Understanding a large, unfamiliar codebase by browsing folders one by one
is slow and gives no sense of how files actually relate to each other.
This tool solves that by scanning a local Git repository and turning it
into an interactive, visual map: every file becomes a draggable node,
every import becomes a connecting edge, and every file shows its lines
of code and a computed complexity score at a glance. Clicking any file
generates a short, plain-English AI summary of what it does — so a new
contributor can get oriented in minutes instead of hours.

This is the **frontend half** of the project — built with React and
React Flow. It consumes a REST API from a separate Python/FastAPI
backend (see that repo/branch for scanning, parsing, and AI logic).

### How this differs from existing tools

Tools like `dependency-cruiser` or an IDE's "Graph View" can visualize
import structure, but they stop there — they don't explain *what* a file
does, and they're typically read-only, static diagrams rather than a
live, draggable canvas. This project combines three things existing
tools usually keep separate:

- **Live dependency graph** (like dependency-cruiser) — but interactive
  and draggable via React Flow, not a static SVG/PNG export.
- **Code metrics per file** (LoC, complexity) shown directly on each
  node, so bloated or risky files are visible without opening them.
- **AI-generated, on-demand summaries** of any file's purpose — no
  existing dependency-graph tool offers this; it directly targets the
  "slow onboarding" problem rather than just the "I can't see the
  structure" problem.

### Features

- Scans any local directory and detects file structure automatically
- Full import-dependency edge resolution for Python files; other file
  types still appear as nodes with LoC, even without resolved edges
- Per-file metrics: lines of code, complexity score, file size
- Color-coded complexity (green/amber/red) for instant visual triage
- Fully interactive canvas: drag, zoom, pan, minimap navigation
- Click-to-summarize: AI-generated 3-sentence explanation of any file,
  powered by Gemini
- Backend-side caching by file content hash, plus a second client-side
  cache layer — a file is never re-sent to the AI twice unless its
  content actually changes
- Clean separation between frontend and backend via a documented REST
  contract, allowing both to be developed and tested independently
  using mock data

## Tech stack

- React 18 + Vite
- [reactflow](https://reactflow.dev/) — draggable node/edge canvas
- [zustand](https://github.com/pmndrs/zustand) — global state store
- [axios](https://axios-http.com/) — HTTP requests to the backend

## Getting started

```bash
npm install
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`).

By default this runs against **mock data** — no backend required to see
the UI working (see below for connecting the real backend).

## Mock data vs. real backend

This frontend was built against **mock data** that exactly matches the
backend's real response shape, so frontend and backend work could happen
in parallel.

By default, the app uses mock data (`src/data/mockGraph.js`) and does not
require the backend to be running.

### Connecting to the real backend

**Use two separate folders/clones** — one for the frontend (this repo,
checked out on the frontend branch), one for the backend (checked out
on `main`). Running both branches out of the same folder at the same
time causes git checkout conflicts when both dev servers are active.

**1. Set up and run the backend** (in its own folder, on `main`):
```bash
python3 -m venv venv
source venv/Scripts/activate   # or venv/bin/activate on Mac/Linux
pip install -r requirements.txt
cp .env.example .env
```
Open the new `.env` file (not `.env.example` — the app only reads `.env`)
and add a real key:
```
GEMINI_API_KEY=your_real_key_here
```
Then run:
```bash
uvicorn app.main:app --reload --port 8000
```
Confirm it's alive: open `http://localhost:8000/api/health` in a browser.

**2. Set up the frontend** (in this folder):
```bash
npm install
```
Create a `.env` file in this project's root:
```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000
```
Restart `npm run dev` (Vite only reads `.env` on startup).

**3. Point the scan at a real folder.** In `src/App.jsx`, update:
```js
const DEMO_REPO_PATH = "/path/to/some/local/repo";
```
to a real local path you want to visualize. Save — the dev server hot-reloads.

No component code needs to change beyond that — `src/api/graphApi.js` is
the only file that knows about mock vs. real data.

### Common issues

- **CORS error in browser console**: the backend's `.env` needs
  `CORS_ORIGINS=http://localhost:5173` set (already included in
  `.env.example`).
- **`ModuleNotFoundError` on backend startup**: the virtual environment
  isn't activated, or dependencies weren't installed in it. Run
  `source venv/Scripts/activate` then `pip install -r requirements.txt`
  again.
- **`pydantic-core` fails to build / Rust compiler errors during
  `pip install`**: this means Python's version is too new for prebuilt
  wheels (seen on Python 3.14). Use Python 3.11 instead:
  `py -3.11 -m venv venv`.
- **Stuck on "Generating summary…" forever**: check the backend
  terminal for the actual error. A `502` usually means the Gemini API
  key is missing or invalid in `.env`.

## Project structure

```
src/
├── api/
│   └── graphApi.js       # All backend calls (mock/real toggle lives here)
├── components/
│   ├── FileNode.jsx      # Custom React Flow node (filename, LoC, complexity color)
│   ├── GraphCanvas.jsx   # The React Flow canvas itself
│   └── SummaryPanel.jsx  # Side panel showing AI summary for selected file
├── data/
│   └── mockGraph.js      # Mock graph + mock AI summaries, matching real API shape
├── hooks/
│   └── useSummarizeOnSelect.js  # Click handler: select node + fetch summary (with client-side cache)
├── store/
│   └── useGraphStore.js  # Zustand store: graph data, selected node, summary cache
├── utils/
│   └── layout.js         # Computes node x/y positions from dependency depth
├── App.jsx               # Loads graph on mount, renders canvas + panel
└── main.jsx
```

## API contract (backend)

**POST `/api/scan`** — body: `{ "path": "/some/repo" }`
Scans a directory and returns the graph:
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

**GET `/api/graph`** — returns the last scan result without re-scanning.

**POST `/api/summarize`** — body: `{ "root_path": "...", "relative_path": "app/main.py" }`
Response: `{ "relative_path": "app/main.py", "summary": "...", "cached": false }`

**GET `/api/health`** — health check.

## How the layout works

The backend only knows *which files depend on which* — it doesn't say
where to draw anything. `src/utils/layout.js` computes each file's
"depth" in the dependency graph (files with no imports are depth 0,
files that import them are depth 1, etc.) and arranges files at the same
depth in a row. This produces a top-to-bottom dependency flow rather
than a random scatter.

## Client-side summary caching

The backend caches AI summaries by file content hash, so the same
unchanged file is never re-sent to the AI API twice. The frontend adds
a second layer of caching in the Zustand store (`src/store/useGraphStore.js`):
once a summary has been fetched for a node in the current session, clicking
that node again reuses the cached result instantly with no network call.

## Assumptions and limitations

- Dependency *edges* are only resolved for Python files (`import` /
  `from ... import` statements). Other file types (JS, CSS, Markdown,
  etc.) still appear as nodes with accurate LoC and size metrics, but
  without resolved edges — per the original project scope.
- Complexity is a numeric score returned by the backend; the frontend
  buckets it into low/medium/high purely for color display (thresholds:
  <4 low, 4–6 medium, 7+ high). These thresholds are a frontend display
  choice and can be tuned without backend changes.
- Node layout (x/y position) is computed entirely on the frontend from
  dependency depth, since the backend only returns *relationships*, not
  coordinates — this means the same repo will always lay out
  consistently, but very large or highly interconnected repos may need
  manual dragging for the clearest view.
- AI summaries require a valid `GEMINI_API_KEY` in the backend's `.env`.
  Without one, the graph and metrics still work fully — only the
  AI-summary feature is affected.
- Designed and tested for local repositories. There's no remote-Git or
  authentication handling, since the scope is local codebase analysis.

### Possible extensions (not yet implemented)

- Dependency edge resolution for JavaScript/TypeScript `import` and
  C/C++ `#include` statements (current scope: Python only)
- A UI input field to choose the scan path interactively, instead of a
  hardcoded path in `App.jsx`
- Persisting node positions between scans (currently recalculated each
  scan via the dependency-depth layout)