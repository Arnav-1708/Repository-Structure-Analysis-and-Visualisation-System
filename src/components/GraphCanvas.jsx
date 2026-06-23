import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import FileNode from "./FileNode";
import { useGraphStore } from "../store/useGraphStore";
import { useSummarizeOnSelect } from "../hooks/useSummarizeOnSelect";

// Registers custom node type with React Flow.
// Key ("file") must match the `type: "file"` we set on each node in App.jsx.
const nodeTypes = { file: FileNode };

function GraphCanvas() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setGraph = useGraphStore((state) => state.setGraph);
  const rootPath = useGraphStore((state) => state.rootPath);
  const selectAndSummarize = useSummarizeOnSelect();

  // Lets users drag nodes around — without this, the canvas renders
  // but nodes would be frozen in place.
  const onNodesChange = useCallback(
    (changes) =>
      setGraph({ nodes: applyNodeChanges(changes, nodes), edges, rootPath }),
    [nodes, edges, rootPath, setGraph]
  );

  const onEdgesChange = useCallback(
    (changes) =>
      setGraph({ nodes, edges: applyEdgeChanges(changes, edges), rootPath }),
    [nodes, edges, rootPath, setGraph]
  );

  const onNodeClick = useCallback(
    (_event, node) => selectAndSummarize(node.id),
    [selectAndSummarize]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default GraphCanvas;