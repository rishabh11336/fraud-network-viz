import Link from "next/link";
import type { ClusterSummary } from "@/lib/types";
import {
  FEATURED_CASES,
  FEATURED_CLUSTER_IDS,
  linkingSnippet,
} from "@/lib/story";
import TierBadge from "./TierBadge";
import SignalChip from "./SignalChip";

export default function FeaturedCases({
  clusters,
}: {
  clusters: ClusterSummary[];
}) {
  const byId = new Map(clusters.map((c) => [c.cluster_id, c]));

  return (
    <div className="case-grid">
      {FEATURED_CLUSTER_IDS.map((id) => {
        const cluster = byId.get(id);
        const story = FEATURED_CASES[id];
        if (!cluster || !story) return null;
        return (
          <Link
            key={id}
            href={`/explorer?cluster=${id}`}
            className="case-card"
          >
            <div className="case-kicker">{story.kicker}</div>
            <h3>{story.title}</h3>
            <p>{story.body}</p>
            <div className="case-meta">
              <span className="mono">{cluster.cluster_id}</span>
              <span>{cluster.size} accounts</span>
              <TierBadge tier={cluster.confidence_tier} />
              <SignalChip signal={cluster.dominant_signal} />
            </div>
            <div className="case-snippet mono">
              {linkingSnippet(cluster.linking_values, 48)}
            </div>
            <span className="case-cta">Open in explorer →</span>
          </Link>
        );
      })}
    </div>
  );
}
