import Link from "next/link";
import { parseClusters, parseEdges, buildGraph } from "@/lib/parse";
import type { ConfidenceTier } from "@/lib/types";
import fs from "fs";
import path from "path";
import TierBadge from "@/components/TierBadge";
import SignalChip from "@/components/SignalChip";
import ClustersTable from "@/components/ClustersTable";

export const metadata = {
  title: "FraudNet — Signup Abuse Cluster Visualizer",
  description: "Interactive network visualization of fraud clusters detected via entity linkage.",
};

async function getData() {
  const dataDir = path.join(process.cwd(), "public", "data");
  const clustersCsv = fs.readFileSync(path.join(dataDir, "clusters.csv"), "utf-8");
  const edgesCsv    = fs.readFileSync(path.join(dataDir, "edges.csv"), "utf-8");
  const clusters    = parseClusters(clustersCsv);
  const edges       = parseEdges(edgesCsv);
  return buildGraph(clusters, edges);
}

const TIER_ORDER: ConfidenceTier[] = ["CERTAIN", "HIGH", "MEDIUM"];

export default async function Home() {
  const graph = await getData();

  const tierCounts = TIER_ORDER.reduce((acc, t) => {
    acc[t] = graph.clusters.filter((c) => c.confidence_tier === t).length;
    return acc;
  }, {} as Record<ConfidenceTier, number>);

  const signalCounts = graph.clusters.reduce((acc, c) => {
    acc[c.dominant_signal] = (acc[c.dominant_signal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topClusters = graph.clusters.slice(0, 10);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div className="landing">
        {/* Hero */}
        <div className="landing-hero">
          <div className="badge">
            <span>🔗</span> Entity Linkage
          </div>
          <h1>Fraud Cluster Network</h1>
          <p>
            Visual explorer for signup abuse clusters detected through multi-signal entity linkage.
            Linked accounts share phone numbers, card details, device hashes, or normalized names.
          </p>
          <Link href="/explorer" className="btn-primary">
            Open Network Explorer →
          </Link>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total Clusters</div>
            <div className="stat-value">{graph.clusters.length}</div>
            <div className="stat-sub">suspected actors</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Linked Accounts</div>
            <div className="stat-value">{graph.nodes.length}</div>
            <div className="stat-sub">accounts in clusters</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Edges</div>
            <div className="stat-value">{graph.links.length}</div>
            <div className="stat-sub">account links</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">CERTAIN tier</div>
            <div className="stat-value" style={{ color: "var(--certain)" }}>{tierCounts.CERTAIN}</div>
            <div className="stat-sub">highest confidence</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">HIGH tier</div>
            <div className="stat-value" style={{ color: "var(--high)" }}>{tierCounts.HIGH}</div>
            <div className="stat-sub">strong confidence</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">MEDIUM tier</div>
            <div className="stat-value" style={{ color: "var(--medium)" }}>{tierCounts.MEDIUM}</div>
            <div className="stat-sub">moderate confidence</div>
          </div>
        </div>

        {/* Signal breakdown */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 12 }}>Dominant Signals</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(signalCounts).sort((a, b) => b[1] - a[1]).map(([sig, count]) => (
              <div
                key={sig}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <SignalChip signal={sig} />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{count}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>clusters</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top clusters table */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2>Top Clusters by Confidence</h2>
            <Link href="/explorer" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
              View all in explorer →
            </Link>
          </div>
          <ClustersTable clusters={topClusters} />
        </div>
      </div>
    </div>
  );
}
