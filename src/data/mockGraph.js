// Mock data matching the ACTUAL backend contract (POST /api/scan response shape).
// Once the real backend is running, this file becomes unnecessary —
// see src/api/graphApi.js for where the swap happens.

export const mockGraphData = {
  root_path: "/Users/demo/sample-repo",
  nodes: [
    { id: "app/main.py", label: "main.py", extension: "py", metrics: { loc: 18, complexity: 1, size_bytes: 512 } },
    { id: "app/core/config.py", label: "config.py", extension: "py", metrics: { loc: 45, complexity: 2, size_bytes: 1320 } },
    { id: "app/utils/parser.py", label: "parser.py", extension: "py", metrics: { loc: 142, complexity: 6, size_bytes: 4210 } },
    { id: "app/utils/helpers.py", label: "helpers.py", extension: "py", metrics: { loc: 38, complexity: 2, size_bytes: 980 } },
    { id: "app/api/routes.py", label: "routes.py", extension: "py", metrics: { loc: 310, complexity: 9, size_bytes: 9870 } },
    { id: "app/api/models.py", label: "models.py", extension: "py", metrics: { loc: 89, complexity: 3, size_bytes: 2440 } },
    { id: "app/graph/builder.py", label: "builder.py", extension: "py", metrics: { loc: 256, complexity: 8, size_bytes: 7650 } },
    { id: "app/services/summarizer.py", label: "summarizer.py", extension: "py", metrics: { loc: 121, complexity: 4, size_bytes: 3540 } },
    { id: "README.md", label: "README.md", extension: "md", metrics: { loc: 64, complexity: 1, size_bytes: 1890 } },
  ],
  edges: [
    { id: "app/main.py->app/core/config.py", source: "app/main.py", target: "app/core/config.py" },
    { id: "app/main.py->app/api/routes.py", source: "app/main.py", target: "app/api/routes.py" },
    { id: "app/api/routes.py->app/api/models.py", source: "app/api/routes.py", target: "app/api/models.py" },
    { id: "app/api/routes.py->app/graph/builder.py", source: "app/api/routes.py", target: "app/graph/builder.py" },
    { id: "app/graph/builder.py->app/utils/parser.py", source: "app/graph/builder.py", target: "app/utils/parser.py" },
    { id: "app/utils/parser.py->app/utils/helpers.py", source: "app/utils/parser.py", target: "app/utils/helpers.py" },
    { id: "app/api/routes.py->app/services/summarizer.py", source: "app/api/routes.py", target: "app/services/summarizer.py" },
  ],
};

// Mock response shape for POST /api/summarize, keyed by relative_path.
// Real response: { relative_path, summary, cached }
export const mockSummaries = {
  "app/main.py": "This file is the application's entry point. It creates the FastAPI app instance and wires up the API routes.",
  "app/core/config.py": "This file defines configuration settings, like environment variables and app-wide constants, loaded once at startup.",
  "app/utils/parser.py": "This file scans Python source files and extracts import statements to figure out which files depend on which.",
  "app/utils/helpers.py": "This file contains small reusable helper functions, such as counting lines of code in a file.",
  "app/api/routes.py": "This file defines all the REST API endpoints, including scanning a repo, fetching the graph, and getting AI summaries.",
  "app/api/models.py": "This file defines the Pydantic data models used to validate API requests and structure responses.",
  "app/graph/builder.py": "This file builds the dependency graph from parsed files, turning import relationships into nodes and edges.",
  "app/services/summarizer.py": "This file calls the Gemini API to generate a short summary of a file's purpose, and caches the result locally.",
  "README.md": "This file explains what the project does, how to set it up, and documents the available API endpoints.",
};