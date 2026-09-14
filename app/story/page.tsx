import { Suspense } from "react";
import StoryWalk from "@/components/StoryWalk";

export const metadata = {
  title: "How we linked them — FraudNet",
  description:
    "A walkthrough of signup-abuse entity linkage: collision hubs, Gmail disguise rings, the address gate, and the Cabrera case — told with small networks, not a spreadsheet.",
};

export default function StoryPage() {
  return (
    <Suspense
      fallback={
        <div className="graph-loading" style={{ height: "100%" }}>
          <div className="spinner" />
        </div>
      }
    >
      <StoryWalk />
    </Suspense>
  );
}
