import Link from "next/link";
import { parseClusters, parseEdges, buildGraph } from "@/lib/parse";
import type { ConfidenceTier } from "@/lib/types";
import fs from "fs";
import path from "path";
import SignalChip from "@/components/SignalChip";
import ClustersTable from "@/components/ClustersTable";
import FeaturedCases from "@/components/FeaturedCases";
import { DEFAULT_EXPLORER_CLUSTER } from "@/lib/story";

export const metadata = {
  title: "FraudNet — Signup Abuse Cluster Visualizer",
  description:
    "15,008 unlabeled signups. 251 likely multi-account actors. Explore the clusters we would take to a merchant.",
};

async function getData() {
  const dataDir = path.join(process.cwd(), "public", "data");
  const clustersCsv = fs.readFileSync(path.join(dataDir, "clusters.csv"), "utf-8");
  const edgesCsv = fs.readFileSync(path.join(dataDir, "edges.csv"), "utf-8");
  const clusters = parseClusters(clustersCsv);
  const edges = parseEdges(edgesCsv);
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

  const largestRings = graph.clusters.slice(0, 8);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div className="landing">
        <div className="landing-hero">
          <div className="badge">Signup abuse · entity linkage</div>
          <h1>15,008 unlabeled signups. 251 likely multi-account actors.</h1>
          <p>
            A merchant handed over a snapshot with no labels — nobody said who
            was abusive, or whether abuse existed at all. We linked accounts
            only when a strong identity signal, or two weaker ones, said they
            were the same person. Legitimate customers stay out of the graph.
          </p>
          <div className="hero-actions">
            <Link href="/story" className="btn-primary">
              Read the story →
            </Link>
            <Link
              href={`/explorer?cluster=${DEFAULT_EXPLORER_CLUSTER}`}
              className="btn-ghost"
            >
              Skip to the largest ring
            </Link>
          </div>
        </div>

        <ol className="funnel">
          <li>
            <span className="funnel-n">15,008</span>
            <span className="funnel-l">signups in the snapshot</span>
          </li>
          <li>
            <span className="funnel-n">keys</span>
            <span className="funnel-l">every field collapsed to an identity</span>
          </li>
          <li>
            <span className="funnel-n">{graph.links.length}</span>
            <span className="funnel-l">pairs that cleared the gate</span>
          </li>
          <li>
            <span className="funnel-n">{graph.clusters.length}</span>
            <span className="funnel-l">clusters / {graph.nodes.length} linked accounts</span>
          </li>
        </ol>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">CERTAIN</div>
            <div className="stat-value" style={{ color: "var(--certain)" }}>
              {tierCounts.CERTAIN}
            </div>
            <div className="stat-sub">would take to a merchant</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">HIGH</div>
            <div className="stat-value" style={{ color: "var(--high)" }}>
              {tierCounts.HIGH}
            </div>
            <div className="stat-sub">strong, needs a second look</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">MEDIUM</div>
            <div className="stat-value" style={{ color: "var(--medium)" }}>
              {tierCounts.MEDIUM}
            </div>
            <div className="stat-sub">corroborated, not proven</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Left out</div>
            <div className="stat-value">
              {(15008 - graph.nodes.length).toLocaleString()}
            </div>
            <div className="stat-sub">singletons we refused to link</div>
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 8 }}>Three cases worth opening</h2>
          <p style={{ marginBottom: 16, maxWidth: 640 }}>
            Start here instead of the full graph. Each card is a real cluster
            from this run.
          </p>
          <FeaturedCases clusters={graph.clusters} />
        </div>

        <div style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 8 }}>What actually linked them</h2>
          <p style={{ marginBottom: 14, maxWidth: 640 }}>
            Most CERTAIN clusters are Gmail alias rings. Device hash and card
            (BIN + last 4) are the interesting minority — rarer, and usually
            the cases that are not just the same inbox.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(signalCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([sig, count]) => (
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
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {count}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    clusters
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h2>Largest rings</h2>
            <Link href="/explorer?view=all" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
              View all {graph.clusters.length} in explorer →
            </Link>
          </div>
          <p style={{ marginBottom: 12, maxWidth: 640 }}>
            Sorted by size among CERTAIN, then HIGH. That is not the same as
            link weight — a two-account Gmail alias can score higher than a
            nine-account ring.
          </p>
          <ClustersTable clusters={largestRings} />
        </div>
      </div>
    </div>
  );
}
