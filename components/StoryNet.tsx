"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Pt = { x: number; y: number };
type Frame = { w: number; h: number };

function polar(cx: number, cy: number, r: number, i: number, n: number, offset = -Math.PI / 2): Pt {
  const nSafe = Math.max(n, 1);
  const a = offset + (2 * Math.PI * i) / nSafe;
  return {
    x: Math.round(cx + r * Math.cos(a)),
    y: Math.round(cy + r * Math.sin(a)),
  };
}

function layout(
  nodes: SceneNode[],
  compact: boolean,
  frame: Frame
): { pos: Record<string, Pt>; W: number; H: number; s: number } {
  const pos: Record<string, Pt> = {};
  const groups = ["left", "center", "right"] as const;
  const present = groups.filter((g) => nodes.some((n) => (n.group ?? "center") === g));
  const useGroups = nodes.some((n) => n.group) && present.length > 1;

  const SHORT = 420;
  const aspect = frame.w / Math.max(frame.h, 1);
  let W: number;
  let H: number;
  if (compact) {
    W = 400;
    H = 400;
  } else if (aspect >= 1) {
    H = SHORT;
    W = Math.max(SHORT, Math.round(SHORT * aspect));
  } else {
    W = SHORT;
    H = Math.max(SHORT, Math.round(SHORT / aspect));
  }
  const s = compact ? 1 : Math.min(W, H) / SHORT;

  const placeCluster = (subset: SceneNode[], cx: number, cy: number, cell: number) => {
    const tokens = subset.filter((n) => n.kind !== "account");
    const accounts = subset.filter((n) => n.kind === "account");
    const tokenGap = Math.min(cell * 0.26, 90 * s);
    const tokenR = cell * 0.14;
    const acctR = tokens.length === 0
      ? cell * 0.38
      : cell * (accounts.length > 6 ? 0.36 : 0.32);

    if (tokens.length === 0) {
      accounts.forEach((n, i) => {
        pos[n.id] = polar(cx, cy, acctR, i, accounts.length);
      });
      return;
    }
    if (tokens.length === 1) {
      pos[tokens[0].id] = { x: cx, y: cy };
    } else if (tokens.length === 2) {
      pos[tokens[0].id] = { x: Math.round(cx - tokenGap), y: cy };
      pos[tokens[1].id] = { x: Math.round(cx + tokenGap), y: cy };
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
    placeCluster(nodes, W / 2, H / 2, Math.min(W, H) * 0.92);
    return { pos, W, H, s };
  }

  if (compact) {
    H = 168 * present.length + 24;
    const rowH = (H - 24) / present.length;
    present.forEach((g, gi) => {
      const subset = nodes.filter((n) => (n.group ?? "center") === g);
      const cx = W / 2;
      const cy = 12 + rowH * gi + rowH / 2;
      placeCluster(subset, cx, cy, rowH * 0.88);
    });
    return { pos, W, H, s };
  }

  const colW = W / present.length;
  const cell = Math.min(colW, H) * 0.9;
  present.forEach((g, gi) => {
    const subset = nodes.filter((n) => (n.group ?? "center") === g);
    const cx = colW * gi + colW / 2;
    const cy = H / 2;
    placeCluster(subset, cx, cy, cell);
  });
  return { pos, W, H, s };
}

function isToken(n: SceneNode) {
  return n.kind !== "account";
}

export default function StoryNet({ scene }: { scene: Scene }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const [frame, setFrame] = useState<Frame>({ w: 640, h: 420 });
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap) return;
    const measure = () => {
      setCompact(wrap.clientWidth < 520);
      const box = stage ?? wrap;
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (w > 8 && h > 8) {
        setFrame((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    if (stage) ro.observe(stage);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { pos, W, H, s } = useMemo(
    () => layout(scene.nodes, compact, frame),
    [scene, compact, frame]
  );
  const kindsPresent = [...new Set(scene.nodes.map((n) => n.kind))];
  const tonesPresent = [...new Set(scene.links.map((l) => l.tone))];
  const tokenW = compact ? 108 : Math.min(168, 132 * Math.max(s, 1));
  const tokenH = compact ? 28 : Math.min(36, 30 * Math.max(s, 1));
  const padX = Math.round(28 * Math.max(s, 1));
  const padY = Math.round(36 * Math.max(s, 1));

  return (
    <div className={`story-net${compact ? " is-compact" : ""}`} ref={wrapRef}>
      <div className="story-net-stage" ref={stageRef}>
        <svg
          viewBox={`${-padX} ${-padY} ${W + padX * 2} ${H + padY * 2}`}
          className="story-net-svg"
          role="img"
          aria-label={scene.graphCaption}
          preserveAspectRatio="xMidYMid meet"
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
            const r = (compact ? 12 : 14) * Math.max(s, 1);
            const fill = n.dim ? "#1a1d24" : token ? KIND_COLOR[n.kind] : "#1a1d24";
            const stroke = KIND_COLOR[n.kind];
            const active = hover === n.id;
            const maxLen = compact ? 18 : 22;
            const label = n.label.length > maxLen
              ? `${n.label.slice(0, maxLen - 1)}…`
              : n.label;
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
                    x={-tokenW / 2}
                    y={-tokenH / 2}
                    rx={8}
                    width={tokenW}
                    height={tokenH}
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
                  y={token ? 4 : 14 + r}
                  textAnchor="middle"
                  className={token ? "story-token-label" : "story-acct-label"}
                  fill={token ? stroke : "#9aa0b4"}
                  opacity={n.dim ? 0.5 : 1}
                >
                  {label}
                </text>
                {token && n.sub && (
                  <text y={tokenH / 2 + 12} textAnchor="middle" className="story-sub">
                    {n.sub}
                  </text>
                )}
                {!token && n.sub && active && (
                  <text y={r + 26} textAnchor="middle" className="story-sub">
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="story-graph-meta">
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
    </div>
  );
}
