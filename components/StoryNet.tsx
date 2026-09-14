"use client";

import { useMemo, useState } from "react";
import type { Scene, SceneNode, NodeKind, LinkTone } from "@/lib/scenes";

const KIND_COLOR: Record<NodeKind, string> = {
  account: "#e8eaf0",
  email: "#7c6af7",
  device: "#43c59e",
  ip: "#5a6175",
  card: "#3db9cf",
  address: "#8b9cb3",
  ua: "#5a6175",
  name: "#e879a0",
};

const TONE_COLOR: Record<LinkTone, string> = {
  high: "#7c6af7",
  medium: "#43c59e",
  weak: "#363c4e",
  rejected: "#ff4d6d",
};

const W = 640;
const H = 420;

type Pt = { x: number; y: number };

function polar(cx: number, cy: number, r: number, i: number, n: number, offset = -Math.PI / 2): Pt {
  const nSafe = Math.max(n, 1);
  const a = offset + (2 * Math.PI * i) / nSafe;
  return {
    x: Math.round(cx + r * Math.cos(a)),
    y: Math.round(cy + r * Math.sin(a)),
  };
}

function layout(nodes: SceneNode[]): Record<string, Pt> {
  const pos: Record<string, Pt> = {};
  const groups = ["left", "center", "right"] as const;
  const present = groups.filter((g) => nodes.some((n) => (n.group ?? "center") === g));
  const useGroups = nodes.some((n) => n.group) && present.length > 1;

  const placeCluster = (
    subset: SceneNode[],
    cx: number,
    cy: number,
    tokenR: number,
    acctR: number
  ) => {
    const tokens = subset.filter((n) => n.kind !== "account");
    const accounts = subset.filter((n) => n.kind === "account");
    if (tokens.length === 0) {
      accounts.forEach((n, i) => {
        pos[n.id] = polar(cx, cy, Math.min(acctR, 70 + accounts.length * 4), i, accounts.length);
      });
      return;
    }
    if (tokens.length === 1) {
      pos[tokens[0].id] = { x: cx, y: cy };
    } else if (tokens.length === 2) {
      pos[tokens[0].id] = { x: cx - 72, y: cy };
      pos[tokens[1].id] = { x: cx + 72, y: cy };
    } else {
      tokens.forEach((n, i) => {
        pos[n.id] = polar(cx, cy - 8, tokenR, i, tokens.length, Math.PI);
      });
    }
    accounts.forEach((n, i) => {
      pos[n.id] = polar(cx, cy, acctR, i, accounts.length);
    });
  };

  if (!useGroups) {
    placeCluster(nodes, W / 2, H / 2 + 8, 54, nodes.length > 8 ? 150 : 128);
    return pos;
  }

  const colW = W / present.length;
  present.forEach((g, gi) => {
    const subset = nodes.filter((n) => (n.group ?? "center") === g);
    const cx = colW * gi + colW / 2;
    const cy = H / 2;
    const acctR = subset.filter((n) => n.kind === "account").length > 5 ? 72 : 68;
    placeCluster(subset, cx, cy, 36, acctR);
  });
  return pos;
}

function isToken(n: SceneNode) {
  return n.kind !== "account";
}

export default function StoryNet({ scene }: { scene: Scene }) {
  const [hover, setHover] = useState<string | null>(null);
  const pos = useMemo(() => layout(scene.nodes), [scene]);
  const kindsPresent = [...new Set(scene.nodes.map((n) => n.kind))];
  const tonesPresent = [...new Set(scene.links.map((l) => l.tone))];

  return (
    <div className="story-net">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="story-net-svg"
        role="img"
        aria-label={scene.graphCaption}
      >
        {scene.links.map((l, i) => {
          const a = pos[l.source];
          const b = pos[l.target];
          if (!a || !b) return null;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const active = hover === `l${i}` || hover === l.source || hover === l.target;
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(`l${i}`)}
              onMouseLeave={() => setHover(null)}
            >
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={TONE_COLOR[l.tone]}
                strokeWidth={active ? 3 : l.tone === "weak" ? 1 : 2}
                strokeOpacity={l.tone === "weak" ? 0.45 : 0.9}
                strokeDasharray={l.tone === "rejected" ? "6 5" : undefined}
              />
              {l.label && active && (
                <text
                  x={mx}
                  y={my - 8}
                  textAnchor="middle"
                  className="story-edge-label"
                >
                  {l.label}
                </text>
              )}
            </g>
          );
        })}

        {scene.nodes.map((n) => {
          const p = pos[n.id];
          if (!p) return null;
          const token = isToken(n);
          const r = token ? 22 : 14;
          const fill = n.dim ? "#1a1d24" : token ? KIND_COLOR[n.kind] : "#1a1d24";
          const stroke = KIND_COLOR[n.kind];
          const active = hover === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "default" }}
            >
              {token ? (
                <rect
                  x={-70}
                  y={-16}
                  rx={8}
                  width={140}
                  height={32}
                  fill={n.dim ? "#111318" : "#1a1d24"}
                  stroke={stroke}
                  strokeWidth={active ? 2.5 : 1.6}
                  opacity={n.dim ? 0.55 : 1}
                />
              ) : (
                <circle
                  r={r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={active ? 2.5 : 1.5}
                  opacity={n.dim ? 0.4 : 1}
                />
              )}
              <text
                y={token ? 4 : 26}
                textAnchor="middle"
                className={token ? "story-token-label" : "story-acct-label"}
                fill={token ? stroke : "#9aa0b4"}
                opacity={n.dim ? 0.5 : 1}
              >
                {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
              </text>
              {token && n.sub && (
                <text y={28} textAnchor="middle" className="story-sub">
                  {n.sub}
                </text>
              )}
              {!token && n.sub && active && (
                <text y={28} textAnchor="middle" className="story-sub">
                  {n.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="story-graph-caption">{scene.graphCaption}</p>
      <div className="story-legend">
        {kindsPresent
          .filter((k) => k !== "account")
          .map((k) => (
            <span key={k} className="story-legend-item">
              <i style={{ background: KIND_COLOR[k] }} />
              {k}
            </span>
          ))}
        {tonesPresent.includes("rejected") && (
          <span className="story-legend-item">
            <i className="dash" style={{ background: TONE_COLOR.rejected }} />
            refused link
          </span>
        )}
        {kindsPresent.includes("account") && (
          <span className="story-legend-item">
            <i style={{ background: "#e8eaf0" }} />
            account
          </span>
        )}
      </div>
    </div>
  );
}
