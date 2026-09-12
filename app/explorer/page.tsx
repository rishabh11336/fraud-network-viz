"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode } from "@/lib/types";
import ClusterList from "@/components/ClusterList";
import DetailPanel from "@/components/DetailPanel";
import { DEFAULT_EXPLORER_CLUSTER } from "@/lib/story";

// Load the heavy D3 canvas only on the client
const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), {
  ssr: false,
  loading: () => (
    <div className="graph-loading">
      <div className="spinner" />
    </div>
  ),
});

function clusterFromUrl(searchParams: URLSearchParams): string | null {
  if (searchParams.get("view") === "all") return null;
  return searchParams.get("cluster") ?? DEFAULT_EXPLORER_CLUSTER;
}

function ExplorerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(() =>
    clusterFromUrl(searchParams)
  );
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((data: GraphData) => {
        setGraphData(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setSelectedClusterId(clusterFromUrl(searchParams));
  }, [searchParams]);

  const setClusterUrl = (id: string | null) => {
    const url = id ? `/explorer?cluster=${id}` : "/explorer?view=all";
    router.replace(url, { scroll: false });
  };

  const handleSelectCluster = (id: string) => {
    const next = selectedClusterId === id ? null : id;
    setSelectedClusterId(next);
    setSelectedNode(null);
    setClusterUrl(next);
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    if (node.cluster_id !== selectedClusterId) {
      setSelectedClusterId(node.cluster_id);
      setClusterUrl(node.cluster_id);
    }
  };

  const handleSelectAccount = (accountId: string) => {
    if (!graphData) return;
    const node = graphData.nodes.find((n) => n.id === accountId);
    if (node) handleNodeClick(node);
  };

  if (loading) {
    return (
      <div className="graph-loading" style={{ height: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Loading graph data…</p>
        </div>
      </div>
    );
  }

  if (!graphData) return null;

  return (
    <div className="explorer-layout" style={{ flex: 1, overflow: "hidden" }}>
      {/* Left: Cluster list */}
      <div className="panel" style={{ borderTop: "none", borderLeft: "none", borderBottom: "none" }}>
        <ClusterList
          clusters={graphData.clusters}
          selectedId={selectedClusterId}
          onSelect={handleSelectCluster}
        />
      </div>

      {/* Center: Graph */}
      <div style={{ position: "relative", overflow: "hidden", background: "var(--bg-base)" }}>
        {/* Toolbar */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          background: "rgba(10,12,16,0.8)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border)",
        }}>
          {selectedClusterId ? (
            <>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Showing cluster</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem", color: "var(--text-primary)" }}>
                {selectedClusterId}
              </span>
              <button
                onClick={() => handleSelectCluster(selectedClusterId)}
                style={{
                  marginLeft: "auto",
                  marginRight: 44,
                  padding: "3px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Show all clusters
              </button>
            </>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              All clusters — click a cluster in the sidebar to focus, or click any node
            </span>
          )}
        </div>

        <div style={{ position: "absolute", inset: 0, paddingTop: 37 }}>
          <GraphCanvas
            graphData={graphData}
            filteredClusterId={selectedClusterId}
            selectedNodeId={selectedNode?.id ?? null}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="panel" style={{ borderTop: "none", borderRight: "none", borderBottom: "none" }}>
        <DetailPanel
          selectedNode={selectedNode}
          selectedClusterId={selectedClusterId}
          graphData={graphData}
          onSelectAccount={handleSelectAccount}
          onClearAccount={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={
      <div className="graph-loading" style={{ height: "100%" }}>
        <div className="spinner" />
      </div>
    }>
      <ExplorerInner />
    </Suspense>
  );
}
