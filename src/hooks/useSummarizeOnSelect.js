import { useCallback } from "react";
import { summarizeFile } from "../api/graphApi";
import { useGraphStore } from "../store/useGraphStore";

/**
 * Returns a function that, given a node id, selects it AND fetches its
 * AI summary — but only if we don't already have one cached in the store.
 *
 * This is the client-side half of the caching story: the backend caches
 * by file content hash (so it doesn't call Gemini twice for an unchanged
 * file), and we additionally cache in the store (so we don't even make a
 * network request twice for the same node within one session).
 */
export function useSummarizeOnSelect() {
  const selectNode = useGraphStore((state) => state.selectNode);
  const rootPath = useGraphStore((state) => state.rootPath);
  const summaries = useGraphStore((state) => state.summaries);
  const setSummaryLoading = useGraphStore((state) => state.setSummaryLoading);
  const setSummaryResult = useGraphStore((state) => state.setSummaryResult);
  const setSummaryError = useGraphStore((state) => state.setSummaryError);

  const selectAndSummarize = useCallback(
    async (nodeId) => {
      selectNode(nodeId);

      const existing = summaries[nodeId];
      // Already have a summary (or one is currently loading) — skip the call.
      if (existing?.summary || existing?.isLoading) return;

      setSummaryLoading(nodeId);
      try {
        const result = await summarizeFile(rootPath, nodeId);
        setSummaryResult(nodeId, {
          summary: result.summary,
          cached: result.cached,
        });
      } catch (err) {
        setSummaryError(nodeId, err.message || "Failed to fetch summary");
      }
    },
    [selectNode, rootPath, summaries, setSummaryLoading, setSummaryResult, setSummaryError]
  );

  return selectAndSummarize;
}