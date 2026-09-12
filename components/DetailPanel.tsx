"use client";
import type { GraphNode, GraphData, ClusterSummary } from "@/lib/types";
import TierBadge from "./TierBadge";
import SignalChip from "./SignalChip";
import { parseSignals } from "@/lib/parse";
import {
  clusterNarrative,
  parseLinkingValues,
  FEATURED_CASES,
  signalLabel,
} from "@/lib/story";

interface Props {
  selectedNode: GraphNode | null;
  selectedClusterId: string | null;
  graphData: GraphData | null;
  onSelectAccount: (id: string) => void;
  onClearAccount: () => void;
}

export default function DetailPanel({
  selectedNode,
  selectedClusterId,
  graphData,
  onSelectAccount,
  onClearAccount,
}: Props) {
  if (!graphData) return null;

  const cluster = selectedClusterId
    ? graphData.clusters.find((c) => c.cluster_id === selectedClusterId) ?? null
    : null;

  if (selectedNode) {
    return (
      <AccountDetail
        selectedNode={selectedNode}
        graphData={graphData}
        onSelectAccount={onSelectAccount}
        onClearAccount={onClearAccount}
      />
    );
  }

  if (cluster) {
    return (
      <ClusterBrief
        cluster={cluster}
        onSelectAccount={onSelectAccount}
      />
    );
  }

  return (
    <div className="panel-header" style={{ height: "100%" }}>
      <h3>Details</h3>
      <div className="detail-empty">
        <p style={{ fontSize: "0.78rem" }}>
          All clusters are on the canvas.
          <br />
          Click a cluster in the list to read why it exists.
        </p>
      </div>
    </div>
  );
}

function ClusterBrief({
  cluster,
  onSelectAccount,
}: {
  cluster: ClusterSummary;
  onSelectAccount: (id: string) => void;
}) {
  const featured = FEATURED_CASES[cluster.cluster_id];
  const linkingPairs = parseLinkingValues(cluster.linking_values);

  return (
    <>
      <div className="panel-header">
        <h3>Cluster brief</h3>
        <p style={{ fontSize: "0.78rem", marginTop: 4, color: "var(--text-muted)" }}>
          {cluster.cluster_id}
          {featured ? ` · ${featured.kicker}` : ""}
        </p>
      </div>
      <div className="panel-body">
        {featured && (
          <div className="detail-section">
            <div className="detail-section-title">{featured.title}</div>
          </div>
        )}

        <p className="cluster-brief-copy">{clusterNarrative(cluster)}</p>

        <div className="detail-section">
          <div className="detail-section-title">Assessment</div>
          <div className="detail-row">
            <span className="detail-key">Confidence</span>
            <span className="detail-val">
              <TierBadge tier={cluster.confidence_tier} />
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Dominant signal</span>
            <span className="detail-val">
              <SignalChip signal={cluster.dominant_signal} />
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Size</span>
            <span className="detail-val">{cluster.size} accounts</span>
          </div>
        </div>

        {linkingPairs.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Shared values</div>
            {linkingPairs.map(([key, val], i) => (
              <div key={i} className="detail-row">
                <span className="detail-key">{signalLabel(key)}</span>
                <span className="detail-val">{val}</span>
              </div>
            ))}
          </div>
        )}

        <div className="detail-section">
          <div className="detail-section-title">
            Accounts ({cluster.accounts.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
            {cluster.accounts.map((id) => (
              <span
                key={id}
                className="account-pill"
                onClick={() => onSelectAccount(id)}
              >
                {id}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "0.72rem", marginTop: 10 }}>
            Click an account or a node to see its edges.
          </p>
        </div>
      </div>
    </>
  );
}

function AccountDetail({
  selectedNode,
  graphData,
  onSelectAccount,
  onClearAccount,
}: {
  selectedNode: GraphNode;
  graphData: GraphData;
  onSelectAccount: (id: string) => void;
  onClearAccount: () => void;
}) {
  const nodeEdges = graphData.links.filter((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
    return src === selectedNode.id || tgt === selectedNode.id;
  });

  const siblings = graphData.nodes.filter(
    (n) => n.cluster_id === selectedNode.cluster_id && n.id !== selectedNode.id
  );

  const linkingPairs = parseLinkingValues(selectedNode.linking_values);

  return (
    <>
      <div className="panel-header">
        <h3>Account detail</h3>
        <p style={{ fontSize: "0.78rem", marginTop: 4, color: "var(--text-muted)" }}>
          {selectedNode.id}
        </p>
        <button className="text-back" onClick={onClearAccount}>
          ← Back to cluster
        </button>
      </div>
      <div className="panel-body">
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

        <div className="detail-section">
          <div className="detail-section-title">Risk assessment</div>
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

        {linkingPairs.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Linking values</div>
            {linkingPairs.map(([key, val], i) => (
              <div key={i} className="detail-row">
                <span className="detail-key">{signalLabel(key)}</span>
                <span className="detail-val">{val}</span>
              </div>
            ))}
          </div>
        )}

        {siblings.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">
              Linked accounts ({siblings.length})
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
                    <span className="account-pill" onClick={() => onSelectAccount(src)}>
                      {src}
                    </span>
                    <span className="edge-sep">↔</span>
                    <span className="account-pill" onClick={() => onSelectAccount(tgt)}>
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
