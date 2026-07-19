import type { DominantSignal } from "@/lib/types";

const ICONS: Record<string, string> = {
  email_alias: "✉",
  card:         "💳",
  device:       "📱",
  name:         "👤",
  addr:         "📍",
  phone:        "📞",
  ip:           "🌐",
};

export default function SignalChip({ signal }: { signal: string }) {
  const icon = ICONS[signal] ?? "🔗";
  const cls = signal.replace(/[^a-z_]/g, "_");
  return (
    <span className={`signal-chip ${cls}`}>
      {icon} {signal.replace(/_/g, " ")}
    </span>
  );
}
