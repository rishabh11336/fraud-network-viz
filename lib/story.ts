import type { ClusterSummary, ParsedSignal } from "./types";
import { parseSignals } from "./parse";

export const DEFAULT_EXPLORER_CLUSTER = "C00052";

export const FEATURED_CLUSTER_IDS = ["C00052", "C00205", "C00235"] as const;

export const SIGNAL_LABELS: Record<string, string> = {
  email_alias: "email alias",
  card: "card (BIN + last 4)",
  device: "device hash",
  name: "normalized name",
  addr: "address",
  phone: "phone",
  ip: "IP",
};

export const SIGNAL_COLOR: Record<string, string> = {
  email_alias: "#7c6af7",
  card: "#3db9cf",
  device: "#43c59e",
  name: "#e879a0",
  addr: "#8b9cb3",
  phone: "#c9a227",
};

export interface FeaturedCase {
  kicker: string;
  title: string;
  body: string;
}

export const FEATURED_CASES: Record<string, FeaturedCase> = {
  C00052: {
    kicker: "Largest ring",
    title: "Nine accounts, one inbox",
    body: "Nine signups reach jamiejackson@gmail.com. One of them also shares a device hash. This is a classic alias ring — the kind of case we would put in front of a merchant.",
  },
  C00205: {
    kicker: "Worked example",
    title: "Same house, three spellings",
    body: "Tammy, Roger, and Michael Cabrera look like different people in the email field. They share a device, and they live at 803 Anderson Drive — typed once as ANDEESON. Address never links a pair by itself; here it only corroborates the device.",
  },
  C00235: {
    kicker: "Precision over recall",
    title: "Same card, two devices",
    body: "Card 453245 ending 5529 shows up at 8089 Gonzalez Ave. A nearby cluster (C00236) has the same card and street, Suite vs STE, and a different device. We did not glue them into one actor.",
  },
};

export function parseLinkingValues(raw: string): [string, string][] {
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const idx = s.indexOf("=");
      return idx >= 0
        ? [s.slice(0, idx).trim(), s.slice(idx + 1).trim()]
        : [s, ""];
    });
}

export function signalLabel(type: string): string {
  return SIGNAL_LABELS[type] ?? type.replace(/_/g, " ");
}

export function linkingSnippet(raw: string, max = 36): string {
  const pairs = parseLinkingValues(raw);
  const preferred = ["email_alias", "phone", "name", "card", "device", "addr"];
  const picked =
    preferred.map((k) => pairs.find(([key]) => key === k)).find(Boolean) ??
    pairs[0];
  const value = picked?.[1] || picked?.[0] || "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function primarySignalType(signals: string): string {
  const parsed = parseSignals(signals);
  if (!parsed.length) return "email_alias";
  return parsed.reduce((best, s) => (s.weight > best.weight ? s : best)).type;
}

export function edgeTooltipHtml(signals: string, weight: number): string {
  const parsed: ParsedSignal[] = parseSignals(signals);
  const rows = parsed
    .map(
      (s) =>
        `<div class="tooltip-row"><span>${signalLabel(s.type)}</span><span>${s.weight.toFixed(2)}</span></div>`
    )
    .join("");
  return `<div class="tooltip-title">Link · weight ${weight.toFixed(2)}</div>${rows}`;
}

export function clusterNarrative(cluster: ClusterSummary): string {
  const featured = FEATURED_CASES[cluster.cluster_id];
  if (featured) return featured.body;

  const pairs = parseLinkingValues(cluster.linking_values);
  const shared = pairs
    .map(([key, val]) => (val ? `${val} (${signalLabel(key)})` : signalLabel(key)))
    .join("; ");

  const noun = cluster.size === 1 ? "account" : "accounts";
  const lead = `${cluster.size} ${noun}, ${cluster.confidence_tier} confidence.`;
  if (!shared) {
    return `${lead} Dominant signal is ${signalLabel(cluster.dominant_signal)}.`;
  }
  return `${lead} They share ${shared}. Dominant signal is ${signalLabel(cluster.dominant_signal)}.`;
}
