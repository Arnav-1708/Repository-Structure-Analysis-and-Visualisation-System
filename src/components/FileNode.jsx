import { Handle, Position } from "reactflow";

// Complexity in the backend is a plain number (cyclomatic-complexity-ish score).
// We bucket it into three bands just for coloring — purely a frontend display
// decision, doesn't require backend agreement on thresholds.
function getComplexityBand(complexity) {
  if (complexity >= 7) return "high";
  if (complexity >= 4) return "medium";
  return "low";
}

const BAND_COLORS = {
  low: { bg: "#e1f5ee", border: "#0f6e56", text: "#085041" },
  medium: { bg: "#faeeda", border: "#854f0b", text: "#633806" },
  high: { bg: "#fcebeb", border: "#a32d2d", text: "#791f1f" },
};

function FileNode({ data, selected }) {
  const { label, extension, metrics } = data;
  const band = getComplexityBand(metrics?.complexity ?? 0);
  const colors = BAND_COLORS[band];

  return (
    <div
      style={{
        background: colors.bg,
        border: `1.5px solid ${selected ? colors.text : colors.border}`,
        borderRadius: 8,
        padding: "8px 12px",
        minWidth: 140,
        boxShadow: selected ? "0 0 0 3px rgba(0,0,0,0.08)" : "none",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Connection points so edges can attach to this node */}
      <Handle type="target" position={Position.Top} style={{ background: colors.border }} />
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border }} />

      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: colors.text,
          marginBottom: 4,
          wordBreak: "break-all",
        }}
      >
        {label}
      </div>

      <div style={{ fontSize: 11, color: colors.text, opacity: 0.85, display: "flex", gap: 8 }}>
        <span>{metrics?.loc ?? 0} LoC</span>
        <span>·</span>
        <span>{extension}</span>
      </div>
    </div>
  );
}

export default FileNode;