import { parseClusters, parseEdges, buildGraph } from "@/lib/parse";
import type { GraphData } from "@/lib/types";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET(): Promise<NextResponse<GraphData>> {
  const dataDir = path.join(process.cwd(), "public", "data");
  const clustersCsv = fs.readFileSync(path.join(dataDir, "clusters.csv"), "utf-8");
  const edgesCsv = fs.readFileSync(path.join(dataDir, "edges.csv"), "utf-8");

  const clusters = parseClusters(clustersCsv);
  const edges = parseEdges(edgesCsv);
  const graph = buildGraph(clusters, edges);

  return NextResponse.json(graph);
}
