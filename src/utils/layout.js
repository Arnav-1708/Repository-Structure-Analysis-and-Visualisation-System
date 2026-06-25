// Computes x/y positions for nodes before handing them to React Flow.
// The backend only knows WHAT depends on WHAT — it never tells us WHERE
// to draw anything. So we compute a simple layered layout here:
//
//   - Nodes with no incoming edges (nothing imports them... wait, actually
//     nothing they depend on) start at depth 0.
//   - A node's depth = 1 + max(depth of everything it imports).
//   - Nodes at the same depth are spaced out horizontally on the same row.
//
// This isn't a fancy graph-layout algorithm, but for typical small/medium
// repos it produces a readable left-to-right (or top-to-bottom) dependency
// flow, which is exactly what dependency-cruiser style tools aim for.

const ROW_HEIGHT = 160;
const COLUMN_WIDTH = 260;

function computeDepths(nodeIds, edges) {
  // adjacency: for each node, list of nodes it depends on (its imports)
  const dependsOn = new Map(nodeIds.map((id) => [id, []]));
  edges.forEach(({ source, target }) => {
    if (dependsOn.has(source)) {
      dependsOn.get(source).push(target);
    }
  });

  const depthCache = new Map();
  const visiting = new Set(); // cycle guard

  function depthOf(id) {
    if (depthCache.has(id)) return depthCache.get(id);
    if (visiting.has(id)) return 0; // break cycles gracefully
    visiting.add(id);

    const deps = dependsOn.get(id) || [];
    const depth = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(depthOf));

    visiting.delete(id);
    depthCache.set(id, depth);
    return depth;
  }

  nodeIds.forEach(depthOf);
  return depthCache;
}

/**
 * Takes raw backend nodes (no position) and returns React Flow-ready
 * nodes with { id, type, position, data }.
 */
export function layoutNodes(rawNodes, edges) {
  const nodeIds = rawNodes.map((n) => n.id);
  const depths = computeDepths(nodeIds, edges);

  // Group nodes by depth so we can space them out row by row.
  const rows = new Map();
  nodeIds.forEach((id) => {
    const depth = depths.get(id) ?? 0;
    if (!rows.has(depth)) rows.set(depth, []);
    rows.get(depth).push(id);
  });

  const positionById = new Map();
  rows.forEach((idsInRow, depth) => {
    idsInRow.forEach((id, indexInRow) => {
      positionById.set(id, {
        x: indexInRow * COLUMN_WIDTH,
        y: depth * ROW_HEIGHT,
      });
    });
  });

  return rawNodes.map((node) => ({
    id: node.id,
    type: "file",
    position: positionById.get(node.id) || { x: 0, y: 0 },
    data: {
      label: node.label,
      extension: node.extension,
      metrics: node.metrics,
    },
  }));
}

/**
 * Backend edges already have { id, source, target } — React Flow accepts
 * that shape directly, so this just adds default styling/markers.
 */
export function layoutEdges(rawEdges) {
  return rawEdges.map((edge) => ({
    ...edge,
    animated: false,
    style: { stroke: "#94a3b8" },
  }));
}