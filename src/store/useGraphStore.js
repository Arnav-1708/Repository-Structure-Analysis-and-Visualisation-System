import { create } from "zustand";

// Central app state:
// - graph data (nodes/edges as React Flow needs them)
// - currently selected node (for the side panel)
// - AI summary text + loading/error state for that node
export const useGraphStore = create((set, get) => ({
  // Raw graph from the backend (or mock), already transformed into
  // React Flow's { id, position, data } node shape.
  nodes: [],
  edges: [],
  rootPath: null,

  // Whether the graph itself is loading (e.g. during a scan).
  isGraphLoading: false,
  graphError: null,

  // Currently selected node's id (null when nothing is selected).
  selectedNodeId: null,

  // Summary cache, keyed by node id, so we don't re-fetch on every click.
  // Shape: { [nodeId]: { summary, cached, isLoading, error } }
  summaries: {},

  setGraph: ({ nodes, edges, rootPath }) =>
    set({ nodes, edges, rootPath, graphError: null }),

  setGraphLoading: (isGraphLoading) => set({ isGraphLoading }),

  setGraphError: (graphError) => set({ graphError, isGraphLoading: false }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  clearSelection: () => set({ selectedNodeId: null }),

  // Called right before requesting a summary, so the panel can show a spinner.
  setSummaryLoading: (nodeId) =>
    set((state) => ({
      summaries: {
        ...state.summaries,
        [nodeId]: { ...state.summaries[nodeId], isLoading: true, error: null },
      },
    })),

  setSummaryResult: (nodeId, { summary, cached }) =>
    set((state) => ({
      summaries: {
        ...state.summaries,
        [nodeId]: { summary, cached, isLoading: false, error: null },
      },
    })),

  setSummaryError: (nodeId, error) =>
    set((state) => ({
      summaries: {
        ...state.summaries,
        [nodeId]: { ...state.summaries[nodeId], isLoading: false, error },
      },
    })),

  // Convenience getter for the panel: returns the selected node's full data,
  // plus whatever we currently know about its summary.
  getSelectedNodeInfo: () => {
    const state = get();
    const node = state.nodes.find((n) => n.id === state.selectedNodeId);
    const summaryState = state.summaries[state.selectedNodeId] || {};
    return { node, ...summaryState };
  },
}));