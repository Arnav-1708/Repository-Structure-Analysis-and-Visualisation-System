# GDSC Frontend — Repository Structure Analysis & Visualisation System

The frontend for a tool that scans a local Git repository and renders its
file structure, import dependencies, and code metrics as an interactive,
draggable graph. Clicking any file shows an AI-generated summary of what
that file does.

Built with **React + Vite** and **React Flow** for the canvas. State is
managed with **Zustand**.

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

## Mock data vs. real backend

This frontend was built against **mock data** that exactly matches the
backend's real response shape, so frontend and backend work could happen
in parallel.

By default, the app uses mock data (`src/data/mockGraph.js`) and does not
require the backend to be running.

To connect to the real backend instead:

1. Make sure the backend is running locally (see backend README), typically:
```bash
   uvicorn app.main:app --reload --port 8000
```
2. Create a `.env` file in this project's root:
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000

3. Restart `npm run dev` (Vite only reads `.env` on startup).

No component code needs to change — `src/api/graphApi.js` is the only
file that knows about mock vs. real data.

> **Note:** if you see a CORS error in the browser console once
> connected to the real backend, the backend needs to allow requests
> from `http://localhost:5173` via FastAPI's `CORSMiddleware`.

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