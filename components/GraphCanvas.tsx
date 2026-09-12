"use client";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { GraphData, GraphNode, GraphLink } from "@/lib/types";
import { SIGNAL_COLOR, primarySignalType, edgeTooltipHtml } from "@/lib/story";

const TIER_COLOR: Record<string, string> = {
  CERTAIN: "#ff4d6d",
  HIGH:     "#ff8c42",
  MEDIUM:   "#f4c542",
};
const TIER_GLOW: Record<string, string> = {
  CERTAIN: "rgba(255,77,109,0.6)",
  HIGH:    "rgba(255,140,66,0.6)",
  MEDIUM:  "rgba(244,197,66,0.6)",
};

interface Props {
  graphData: GraphData;
  filteredClusterId: string | null;  // null = show all
  selectedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
}

export default function GraphCanvas({
  graphData,
  filteredClusterId,
  selectedNodeId,
  onNodeClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Derive visible nodes & links from filteredClusterId
  const visibleNodes: GraphNode[] = filteredClusterId
    ? graphData.nodes.filter((n) => n.cluster_id === filteredClusterId)
    : graphData.nodes;

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleLinks: GraphLink[] = graphData.links.filter((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
    return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
  });

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current!);
    const tooltip = d3.select(tooltipRef.current!);
    svg.selectAll("*").remove();

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const W = svgRef.current!.clientWidth || 800;
    const H = svgRef.current!.clientHeight || 600;

    // Defs — glow filter per tier
    const defs = svg.append("defs");
    ["CERTAIN", "HIGH", "MEDIUM"].forEach((tier) => {
      const filter = defs.append("filter").attr("id", `glow-${tier}`);
      filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Root group for zoom/pan
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    const weightExtent = d3.extent(visibleLinks, (l) => l.combined_weight) as [number, number];
    const strokeScale = d3.scaleLinear()
      .domain(weightExtent[0] !== undefined ? weightExtent : [0, 30])
      .range([0.5, 4]);

    // Radius scale per cluster size (only meaningful in global view)
    const sizeExtent = d3.extent(visibleNodes, (n) => n.cluster_size) as [number, number];
    const rScale = d3.scaleSqrt()
      .domain(sizeExtent[0] !== undefined ? sizeExtent : [1, 10])
      .range(filteredClusterId ? [7, 7] : [4, 14]);

    // Draw links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(visibleLinks)
      .join("line")
      .attr("stroke", (d) => SIGNAL_COLOR[primarySignalType(d.signals)] ?? "#2a2f3d")
      .attr("stroke-width", (d) => strokeScale(d.combined_weight))
      .attr("stroke-opacity", 0.75)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-opacity", 1).attr("stroke-width", strokeScale(d.combined_weight) + 1.5);
        tooltip
          .classed("visible", true)
          .style("left", `${event.clientX + 14}px`)
          .style("top", `${event.clientY - 10}px`)
          .html(edgeTooltipHtml(d.signals, d.combined_weight));
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.clientX + 14}px`)
          .style("top", `${event.clientY - 10}px`);
      })
      .on("mouseout", function (_, d) {
        d3.select(this)
          .attr("stroke-opacity", 0.75)
          .attr("stroke-width", strokeScale(d.combined_weight));
        tooltip.classed("visible", false);
      });

    // Draw nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(visibleNodes)
      .join("circle")
      .attr("r", (d) => rScale(d.cluster_size))
      .attr("fill", (d) => TIER_COLOR[d.confidence_tier])
      .attr("stroke", "#0a0c10")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("stroke", TIER_COLOR[d.confidence_tier])
          .attr("stroke-width", 2.5)
          .style("filter", `url(#glow-${d.confidence_tier})`);
        tooltip
          .classed("visible", true)
          .style("left", `${event.clientX + 14}px`)
          .style("top", `${event.clientY - 10}px`)
          .html(`
            <div class="tooltip-title mono">${d.id}</div>
            <div class="tooltip-row"><span>Cluster</span><span>${d.cluster_id}</span></div>
            <div class="tooltip-row"><span>Tier</span><span>${d.confidence_tier}</span></div>
            <div class="tooltip-row"><span>Signal</span><span>${d.dominant_signal}</span></div>
            <div class="tooltip-row"><span>Cluster size</span><span>${d.cluster_size}</span></div>
          `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.clientX + 14}px`)
          .style("top", `${event.clientY - 10}px`);
      })
      .on("mouseout", function (_, d) {
        d3.select(this)
          .attr("stroke", d.id === selectedNodeId ? "#ffffff" : "#0a0c10")
          .attr("stroke-width", d.id === selectedNodeId ? 2.5 : 1.5)
          .style("filter", d.id === selectedNodeId ? `url(#glow-${d.confidence_tier})` : "");
        tooltip.classed("visible", false);
      })
      .on("click", function (_, d) {
        onNodeClick(d);
      })
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Node labels (only in filtered/cluster view — too noisy globally)
    if (filteredClusterId) {
      g.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(visibleNodes)
        .join("text")
        .text((d) => d.id)
        .attr("font-size", "8px")
        .attr("fill", "#9aa0b4")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => -rScale(d.cluster_size) - 3)
        .style("pointer-events", "none")
        .style("user-select", "none");
    }

    // Force simulation
    const charge = filteredClusterId ? -300 : -60;
    const linkDist = filteredClusterId ? 100 : 40;

    const simulation = d3.forceSimulation<GraphNode>(visibleNodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(visibleLinks)
        .id((d) => d.id)
        .distance(linkDist)
        .strength(0.5))
      .force("charge", d3.forceManyBody().strength(charge))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => rScale(d.cluster_size) + 3))
      .on("tick", () => {
        link
          .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
          .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
          .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
          .attr("y2", (d) => (d.target as GraphNode).y ?? 0);
        node
          .attr("cx", (d) => d.x ?? 0)
          .attr("cy", (d) => d.y ?? 0);
        if (filteredClusterId) {
          g.selectAll<SVGTextElement, GraphNode>(".labels text")
            .attr("x", (d) => d.x ?? 0)
            .attr("y", (d) => d.y ?? 0);
        }
      });

    simulationRef.current = simulation;

    // Initial zoom fit to content after simulation settles
    simulation.on("end", () => {
      if (!svgRef.current) return;
      const bounds = (g.node() as SVGGElement | null)?.getBBox();
      if (!bounds || bounds.width === 0) return;
      const padding = 40;
      const scaleX = W / (bounds.width + padding * 2);
      const scaleY = H / (bounds.height + padding * 2);
      const scale = Math.min(Math.min(scaleX, scaleY), 2);
      const translateX = W / 2 - scale * (bounds.x + bounds.width / 2);
      const translateY = H / 2 - scale * (bounds.y + bounds.height / 2);
      svg.transition().duration(600).call(
        zoom.transform as any,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    });

    // Store zoom for controls
    (svgRef.current as any).__zoom__ = zoom;

    return () => simulation.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, filteredClusterId]);

  // Highlight selected node
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .attr("stroke", (d) => d.id === selectedNodeId ? "#ffffff" : "#0a0c10")
      .attr("stroke-width", (d) => d.id === selectedNodeId ? 2.5 : 1.5)
      .style("filter", (d) => d.id === selectedNodeId ? `url(#glow-${d.confidence_tier})` : "");
  }, [selectedNodeId]);

  // Re-draw when data changes
  useEffect(() => {
    draw();
  }, [draw]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current!);
    const zoom = (svgRef.current as any).__zoom__;
    if (zoom) svg.transition().duration(250).call((zoom as any).scaleBy, 1.4);
  };
  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current!);
    const zoom = (svgRef.current as any).__zoom__;
    if (zoom) svg.transition().duration(250).call((zoom as any).scaleBy, 0.7);
  };
  const handleReset = () => {
    const svg = d3.select(svgRef.current!);
    const zoom = (svgRef.current as any).__zoom__;
    if (zoom) svg.transition().duration(400).call((zoom as any).transform, d3.zoomIdentity);
  };

  return (
    <div className="graph-container">
      <svg ref={svgRef} className="graph-canvas" />
      <div ref={tooltipRef} className="graph-tooltip" />

      <div className="graph-controls">
        <button className="graph-btn" onClick={handleZoomIn} title="Zoom in">＋</button>
        <button className="graph-btn" onClick={handleZoomOut} title="Zoom out">－</button>
        <button className="graph-btn" onClick={handleReset} title="Reset view">⌂</button>
      </div>

      <div className="graph-legend">
        <div className="legend-title">Confidence</div>
        {(["CERTAIN", "HIGH", "MEDIUM"] as const).map((t) => (
          <div key={t} className="legend-item">
            <div className="legend-dot" style={{ background: TIER_COLOR[t], boxShadow: `0 0 6px ${TIER_GLOW[t]}` }} />
            {t}
          </div>
        ))}
        {!filteredClusterId && (
          <>
            <div className="divider" style={{ margin: "6px 0" }} />
            <div className="legend-title">Node size = cluster size</div>
          </>
        )}
        <div className="divider" style={{ margin: "6px 0" }} />
        <div className="legend-title">Edge color = signal</div>
        {(["email_alias", "device", "name", "card"] as const).map((s) => (
          <div key={s} className="legend-item">
            <div className="legend-dot" style={{ background: SIGNAL_COLOR[s] }} />
            {s.replace(/_/g, " ")}
          </div>
        ))}
      </div>

      {visibleNodes.length === 0 && (
        <div className="graph-empty">
          <div className="graph-empty-icon">🌐</div>
          <p>No nodes to display</p>
        </div>
      )}
    </div>
  );
}
