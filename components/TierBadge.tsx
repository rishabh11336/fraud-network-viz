import type { ConfidenceTier } from "@/lib/types";

const ICONS: Record<ConfidenceTier, string> = {
  CERTAIN: "●",
  HIGH: "●",
  MEDIUM: "●",
};

export default function TierBadge({ tier }: { tier: ConfidenceTier }) {
  return (
    <span className={`tier-badge ${tier}`}>
      <span className="tier-dot" />
      {tier}
    </span>
  );
}
