import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Fraud Network Visualizer",
  description:
    "Interactive cluster network visualization for signup abuse detection. Explore linked accounts and fraud signals.",
  openGraph: {
    title: "Fraud Network Visualizer",
    description: "Explore linked fraud clusters and signals interactively.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Navbar />
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {children}
          </main>
          <Analytics />
        </div>
      </body>
    </html>
  );
}
