import Papa from "papaparse";
import type {
  ClusterNode,
  Edge,
  GraphData,
  GraphNode,
  GraphLink,
  ClusterSummary,
  ConfidenceTier,
  DominantSignal,
  ParsedSignal,
} from "./types";

export function parseClusters(csv: string): ClusterNode[] {
  const result = Papa.parse<ClusterNode>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return result.data.map((row) => ({
    ...row,
    cluster_size: Number(row.cluster_size),
    confidence_tier: row.confidence_tier as ConfidenceTier,
    dominant_signal: row.dominant_signal as DominantSignal,
  }));
}

export function parseEdges(csv: string): Edge[] {
  const result = Papa.parse<Edge>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return result.data.map((row) => ({
    ...row,
    combined_weight: Number(row.combined_weight),
  }));
}

export function parseSignals(signals: string): ParsedSignal[] {
  return signals.split("|").map((s) => {
    const [type, weight] = s.split(":");
    return { type: type.trim(), weight: Number(weight) || 0 };
  });
}

export function buildGraph(
  nodes: ClusterNode[],
  edges: Edge[]
): GraphData {
  // Build a map from account_id → cluster_id for fast lookups
  const accountClusterMap = new Map<string, ClusterNode>();
  nodes.forEach((n) => accountClusterMap.set(n.account_id, n));

  // Only keep edges where both accounts are in our cluster set
  const validEdges = edges.filter(
    (e) => accountClusterMap.has(e.account_a) && accountClusterMap.has(e.account_b)
  );

  // Build graph nodes
  const graphNodes: GraphNode[] = nodes.map((n) => ({
    id: n.account_id,
    cluster_id: n.cluster_id,
    cluster_size: n.cluster_size,
    confidence_tier: n.confidence_tier,
    dominant_signal: n.dominant_signal,
    linking_values: n.linking_values,
  }));

  // Build graph links
  const graphLinks: GraphLink[] = validEdges.map((e) => ({
    source: e.account_a,
    target: e.account_b,
    combined_weight: e.combined_weight,
    signals: e.signals,
  }));

  // Build cluster summaries
  const clusterMap = new Map<string, ClusterSummary>();
  nodes.forEach((n) => {
    if (!clusterMap.has(n.cluster_id)) {
      clusterMap.set(n.cluster_id, {
        cluster_id: n.cluster_id,
        size: n.cluster_size,
        confidence_tier: n.confidence_tier,
        dominant_signal: n.dominant_signal,
        accounts: [],
      });
    }
    clusterMap.get(n.cluster_id)!.accounts.push(n.account_id);
  });

  const clusters = Array.from(clusterMap.values()).sort((a, b) => {
    const tierOrder = { CERTAIN: 0, HIGH: 1, MEDIUM: 2 };
    const tierDiff = tierOrder[a.confidence_tier] - tierOrder[b.confidence_tier];
    if (tierDiff !== 0) return tierDiff;
    return b.size - a.size;
  });

  return { nodes: graphNodes, links: graphLinks, clusters };
}

export function getClusterNodes(
  graphData: GraphData,
  clusterId: string
): GraphNode[] {
  return graphData.nodes.filter((n) => n.cluster_id === clusterId);
}

export function getClusterEdges(
  graphData: GraphData,
  clusterId: string
): GraphLink[] {
  const accountIds = new Set(
    graphData.nodes
      .filter((n) => n.cluster_id === clusterId)
      .map((n) => n.id)
  );
  return graphData.links.filter((l) => {
    const src = typeof l.source === "string" ? l.source : l.source.id;
    const tgt = typeof l.target === "string" ? l.target : l.target.id;
    return accountIds.has(src) && accountIds.has(tgt);
  });
}
