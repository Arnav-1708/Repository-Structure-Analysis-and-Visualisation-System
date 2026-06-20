import axios from "axios";
import { mockGraphData, mockSummaries } from "../data/mockGraph";

// Flip this to true once the backend is running locally,
// or set VITE_USE_MOCK=false in a .env file. Nothing else needs to change.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Small artificial delay so the mock feels like a real network call
// (lets you test loading spinners without a real backend).
const fakeDelay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Scans a directory and returns the graph.
 * Real endpoint: POST /api/scan  body: { path }
 */
export async function scanRepo(path) {
  if (USE_MOCK) {
    await fakeDelay(600);
    return mockGraphData;
  }
  const { data } = await api.post("/api/scan", { path });
  return data;
}

/**
 * Returns the last scan result without re-scanning.
 * Real endpoint: GET /api/graph
 */
export async function getGraph() {
  if (USE_MOCK) {
    await fakeDelay(300);
    return mockGraphData;
  }
  const { data } = await api.get("/api/graph");
  return data;
}

/**
 * Gets a short AI summary for one file.
 * Real endpoint: POST /api/summarize  body: { root_path, relative_path }
 * Real response: { relative_path, summary, cached }
 */
export async function summarizeFile(rootPath, relativePath) {
  if (USE_MOCK) {
    await fakeDelay(800);
    const summary =
      mockSummaries[relativePath] ||
      "No summary available for this file yet.";
    return { relative_path: relativePath, summary, cached: false };
  }
  const { data } = await api.post("/api/summarize", {
    root_path: rootPath,
    relative_path: relativePath,
  });
  return data;
}

/**
 * Health check.
 * Real endpoint: GET /api/health
 */
export async function checkHealth() {
  if (USE_MOCK) {
    await fakeDelay(100);
    return { status: "ok (mock)" };
  }
  const { data } = await api.get("/api/health");
  return data;
}