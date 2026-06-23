import { useEffect, useState } from "react";
import GraphCanvas from "./components/GraphCanvas";
import SummaryPanel from "./components/SummaryPanel";
import { scanRepo } from "./api/graphApi";
import { layoutNodes, layoutEdges } from "./utils/layout";
import { useGraphStore } from "./store/useGraphStore";
import "./App.css";

// In mock mode this path is ignored by graphApi.js, but in real mode
// it's the actual local folder the backend will scan. We'll later
// replace this hardcoded value with a user-typed input.
const DEMO_REPO_PATH = "/Users/demo/sample-repo";

function App() {
  const setGraph = useGraphStore((state) => state.setGraph);
  const isGraphLoading = useGraphStore((state) => state.isGraphLoading);
  const graphError = useGraphStore((state) => state.graphError);
  const setGraphLoading = useGraphStore((state) => state.setGraphLoading);
  const setGraphError = useGraphStore((state) => state.setGraphError);

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    async function loadGraph() {
      setGraphLoading(true);
      try {
        const raw = await scanRepo(DEMO_REPO_PATH);
        const nodes = layoutNodes(raw.nodes, raw.edges);
        const edges = layoutEdges(raw.edges);
        setGraph({ nodes, edges, rootPath: raw.root_path });
      } catch (err) {
        setGraphError(err.message || "Failed to load graph");
      } finally {
        setGraphLoading(false);
        setHasLoaded(true);
      }
    }
    loadGraph();
  }, []);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div style={{ flex: 1, position: "relative" }}>
        {isGraphLoading && !hasLoaded && (
          <CenteredMessage text="Scanning repository…" />
        )}
        {graphError && <CenteredMessage text={`Error: ${graphError}`} isError />}
        {!isGraphLoading && !graphError && <GraphCanvas />}
      </div>
      <SummaryPanel />
    </div>
  );
}

function CenteredMessage({ text, isError }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        color: isError ? "#a32d2d" : "#64748b",
      }}
    >
      {text}
    </div>
  );
}

export default App;