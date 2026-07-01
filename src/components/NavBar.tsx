"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

type Theme = "dark" | "light";

export function NavBar() {
  const [theme, setTheme] = useState<Theme>("dark");
  const { user } = useAuth();

  useEffect(() => {
    const current = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    try { localStorage.setItem("electro-theme", next); } catch {}
  }

  return (
    <nav
      className="no-print sticky top-0 z-10 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--hairline)]"
      style={{ background: "var(--canvas)", transition: "background 0.15s ease" }}
    >
      <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--ink)]">
        Electro
      </Link>

      <div className="flex items-center gap-2">
        {user && (
          <Link
            href="/catalog"
            className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors px-2 py-1"
          >
            Catalog
          </Link>
        )}
        {user && (
          <Link
            href="/profile"
            className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors px-2 py-1 max-w-[120px] sm:max-w-none truncate"
          >
            {user.name || user.email}
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          className="text-xs font-medium px-3 py-2 min-h-[40px] rounded-md border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)] active:opacity-70 transition-colors"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </nav>
  );
}
