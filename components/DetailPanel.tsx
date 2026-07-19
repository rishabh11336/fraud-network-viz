"use client";
import type { GraphNode, GraphLink, GraphData } from "@/lib/types";
import TierBadge from "./TierBadge";
import SignalChip from "./SignalChip";
import { parseSignals } from "@/lib/parse";

interface Props {
  selectedNode: GraphNode | null;
  graphData: GraphData | null;
  onSelectAccount: (id: string) => void;
}

export default function DetailPanel({ selectedNode, graphData, onSelectAccount }: Props) {
  if (!selectedNode || !graphData) {
    return (
      <div className="panel-header" style={{ height: "100%" }}>
        <h3>Details</h3>
        <div className="detail-empty">
          <div className="detail-empty-icon">🔍</div>
          <p style={{ fontSize: "0.78rem" }}>Click a node in the graph<br />to see account details</p>
        </div>
      </div>
    );
  }

  // Get all edges touching this node
  const nodeEdges = graphData.links.filter((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
    return src === selectedNode.id || tgt === selectedNode.id;
  });

  // Get sibling accounts in same cluster
  const siblings = graphData.nodes.filter(
    (n) => n.cluster_id === selectedNode.cluster_id && n.id !== selectedNode.id
  );

  // Parse linking values
  const linkingPairs = selectedNode.linking_values
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const idx = s.indexOf("=");
      return idx >= 0 ? [s.slice(0, idx).trim(), s.slice(idx + 1).trim()] : [s, ""];
    });

  return (
    <>
      <div className="panel-header">
        <h3>Account Detail</h3>
        <p style={{ fontSize: "0.78rem", marginTop: 4, color: "var(--text-muted)" }}>
          {selectedNode.id}
        </p>
      </div>
      <div className="panel-body">
        {/* Identity */}
        <div className="detail-section">
          <div className="detail-section-title">Identity</div>
          <div className="detail-row">
            <span className="detail-key">Account</span>
            <span className="detail-val mono">{selectedNode.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Cluster</span>
            <span className="detail-val mono">{selectedNode.cluster_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Cluster size</span>
            <span className="detail-val">{selectedNode.cluster_size} accounts</span>
          </div>
        </div>

        {/* Risk */}
        <div className="detail-section">
          <div className="detail-section-title">Risk Assessment</div>
          <div className="detail-row">
            <span className="detail-key">Confidence</span>
            <span className="detail-val">
              <TierBadge tier={selectedNode.confidence_tier} />
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Signal</span>
            <span className="detail-val">
              <SignalChip signal={selectedNode.dominant_signal} />
            </span>
          </div>
        </div>

        {/* Linking values */}
        {linkingPairs.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Linking Values</div>
            {linkingPairs.map(([key, val], i) => (
              <div key={i} className="detail-row">
                <span className="detail-key">{key}</span>
                <span className="detail-val">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sibling accounts */}
        {siblings.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">
              Linked Accounts ({siblings.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
              {siblings.map((s) => (
                <span
                  key={s.id}
                  className="account-pill"
                  onClick={() => onSelectAccount(s.id)}
                >
                  {s.id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Edges */}
        {nodeEdges.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Edges ({nodeEdges.length})</div>
            {nodeEdges.map((edge, i) => {
              const src = typeof edge.source === "string" ? edge.source : (edge.source as GraphNode).id;
              const tgt = typeof edge.target === "string" ? edge.target : (edge.target as GraphNode).id;
              const signals = parseSignals(edge.signals);
              return (
                <div key={i} className="edge-row">
                  <div className="edge-accounts">
                    <span
                      className="account-pill"
                      style={{ cursor: "pointer" }}
                      onClick={() => onSelectAccount(src)}
                    >
                      {src}
                    </span>
                    <span className="edge-sep">↔</span>
                    <span
                      className="account-pill"
                      style={{ cursor: "pointer" }}
                      onClick={() => onSelectAccount(tgt)}
                    >
                      {tgt}
                    </span>
                  </div>
                  <div className="edge-weight">weight: {edge.combined_weight.toFixed(2)}</div>
                  <div className="edge-signals">
                    {signals.map((s, j) => (
                      <SignalChip key={j} signal={s.type} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
