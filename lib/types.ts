export type ConfidenceTier = "CERTAIN" | "HIGH" | "MEDIUM";
export type DominantSignal = "email_alias" | "card" | "device" | "name";

export interface ClusterNode {
  account_id: string;
  cluster_id: string;
  cluster_size: number;
  confidence_tier: ConfidenceTier;
  dominant_signal: DominantSignal;
  linking_values: string;
}

export interface Edge {
  account_a: string;
  account_b: string;
  combined_weight: number;
  signals: string;
}

export interface ParsedSignal {
  type: string;
  weight: number;
}

export interface ClusterSummary {
  cluster_id: string;
  size: number;
  confidence_tier: ConfidenceTier;
  dominant_signal: DominantSignal;
  linking_values: string;
  accounts: string[];
}

export interface GraphNode {
  id: string;
  cluster_id: string;
  cluster_size: number;
  confidence_tier: ConfidenceTier;
  dominant_signal: DominantSignal;
  linking_values: string;
  // D3 simulation fields (optional, added at runtime)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  combined_weight: number;
  signals: string;
  index?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: ClusterSummary[];
}
