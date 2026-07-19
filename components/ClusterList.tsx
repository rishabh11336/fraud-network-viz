"use client";
import { useState, useMemo } from "react";
import type { ClusterSummary, ConfidenceTier, DominantSignal } from "@/lib/types";
import TierBadge from "./TierBadge";
import SignalChip from "./SignalChip";

const TIERS: ConfidenceTier[] = ["CERTAIN", "HIGH", "MEDIUM"];
const SIGNALS: DominantSignal[] = ["email_alias", "card", "device", "name"];

interface Props {
  clusters: ClusterSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ClusterList({ clusters, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<ConfidenceTier | null>(null);
  const [signalFilter, setSignalFilter] = useState<DominantSignal | null>(null);

  const filtered = useMemo(() => {
    return clusters.filter((c) => {
      if (tierFilter && c.confidence_tier !== tierFilter) return false;
      if (signalFilter && c.dominant_signal !== signalFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.cluster_id.toLowerCase().includes(q) ||
          c.accounts.some((a) => a.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [clusters, tierFilter, signalFilter, search]);

  return (
    <>
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h3>Clusters</h3>
          <span className="count-badge">{filtered.length}</span>
        </div>
        <input
          className="search-input"
          placeholder="Search cluster or account ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-bar">
        <button
          className={`filter-chip${!tierFilter && !signalFilter ? " active" : ""}`}
          onClick={() => { setTierFilter(null); setSignalFilter(null); }}
        >
          All
        </button>
        {TIERS.map((t) => (
          <button
            key={t}
            className={`filter-chip${tierFilter === t ? " active" : ""}`}
            onClick={() => setTierFilter(tierFilter === t ? null : t)}
          >
            {t}
          </button>
        ))}
        <div className="divider" style={{ width: "100%", margin: "2px 0" }} />
        {SIGNALS.map((s) => (
          <button
            key={s}
            className={`filter-chip${signalFilter === s ? " active" : ""}`}
            onClick={() => setSignalFilter(signalFilter === s ? null : s)}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="panel-body" style={{ padding: "8px" }}>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            No clusters match your filters.
          </p>
        )}
        {filtered.map((c) => (
          <div
            key={c.cluster_id}
            className={`cluster-item${selectedId === c.cluster_id ? " selected" : ""}`}
            onClick={() => onSelect(c.cluster_id)}
          >
            <div className="cluster-item-header">
              <span className="cluster-id">{c.cluster_id}</span>
              <span className="cluster-size">{c.size} accts</span>
            </div>
            <div className="cluster-item-footer">
              <TierBadge tier={c.confidence_tier} />
              <SignalChip signal={c.dominant_signal} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
