"use client";
import Link from "next/link";
import type { ClusterSummary } from "@/lib/types";
import TierBadge from "./TierBadge";
import SignalChip from "./SignalChip";

export default function ClustersTable({ clusters }: { clusters: ClusterSummary[] }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Cluster ID", "Size", "Confidence", "Signal", ""].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clusters.map((c, i) => (
            <tr
              key={c.cluster_id}
              style={{ borderBottom: i < clusters.length - 1 ? "1px solid var(--border)" : "none" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "10px 16px" }}>
                <span className="mono" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {c.cluster_id}
                </span>
              </td>
              <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{c.size}</td>
              <td style={{ padding: "10px 16px" }}><TierBadge tier={c.confidence_tier} /></td>
              <td style={{ padding: "10px 16px" }}><SignalChip signal={c.dominant_signal} /></td>
              <td style={{ padding: "10px 16px" }}>
                <Link href={`/explorer?cluster=${c.cluster_id}`} style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
                  Explore →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
