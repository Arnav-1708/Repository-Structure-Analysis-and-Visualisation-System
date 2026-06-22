import { useGraphStore } from "../store/useGraphStore";

function SummaryPanel() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const getSelectedNodeInfo = useGraphStore((state) => state.getSelectedNodeInfo);
  const clearSelection = useGraphStore((state) => state.clearSelection);

  // Nothing selected yet — show a friendly empty state instead of a blank panel.
  if (!selectedNodeId) {
    return (
      <aside style={panelStyle}>
        <div style={{ color: "#64748b", fontSize: 13, marginTop: 24, textAlign: "center" }}>
          Click any file node to see its details and an AI-generated summary.
        </div>
      </aside>
    );
  }

  const { node, summary, cached, isLoading, error } = getSelectedNodeInfo();

  // Selected id exists in the store but the node itself isn't found
  // (shouldn't normally happen, but guards against stale state).
  if (!node) return null;

  const { label, extension, metrics } = node.data;

  return (
    <aside style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, wordBreak: "break-all" }}>{label}</h3>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{node.id}</div>
        </div>
        <button onClick={clearSelection} style={closeButtonStyle} aria-label="Close panel">
          ×
        </button>
      </div>

      {/* Metrics row */}
      <div style={metricsRowStyle}>
        <Metric label="Lines of code" value={metrics?.loc ?? "—"} />
        <Metric label="Complexity" value={metrics?.complexity ?? "—"} />
        <Metric label="Type" value={extension} />
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

      {/* AI summary section */}
      <div>
        <h4 style={{ fontSize: 13, color: "#374151", margin: "0 0 8px 0" }}>AI Summary</h4>

        {isLoading && (
          <div style={{ fontSize: 13, color: "#64748b" }}>Generating summary…</div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: "#a32d2d" }}>
            Couldn't generate a summary. Please try again.
          </div>
        )}

        {!isLoading && !error && summary && (
          <div>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "#1f2937" }}>{summary}</p>
            {cached && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                (cached result)
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && !summary && (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            No summary requested yet.
          </div>
        )}
      </div>
    </aside>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{value}</div>
    </div>
  );
}

const panelStyle = {
  width: 300,
  height: "100%",
  borderLeft: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: 16,
  boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif",
  overflowY: "auto",
};

const metricsRowStyle = {
  display: "flex",
  gap: 16,
  marginTop: 16,
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  fontSize: 18,
  cursor: "pointer",
  color: "#94a3b8",
  lineHeight: 1,
  padding: 0,
};

export default SummaryPanel;