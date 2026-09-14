"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_EXPLORER_CLUSTER } from "@/lib/story";

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <span className="dot" />
        FraudNet
      </Link>
      <div className="navbar-links">
        <Link href="/" className={`nav-link${path === "/" ? " active" : ""}`}>
          Overview
        </Link>
          <Link href="/story" className={`nav-link${path === "/story" ? " active" : ""}`}>
            Story
          </Link>
          <Link href={`/explorer?cluster=${DEFAULT_EXPLORER_CLUSTER}`} className={`nav-link${path === "/explorer" ? " active" : ""}`}>
            Explorer
          </Link>
      </div>
    </nav>
  );
}
