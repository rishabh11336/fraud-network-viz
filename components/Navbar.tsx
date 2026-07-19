"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
        <Link href="/explorer" className={`nav-link${path === "/explorer" ? " active" : ""}`}>
          Explorer
        </Link>
      </div>
    </nav>
  );
}
