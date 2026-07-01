"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Theme = "dark" | "light";

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/[\s@.]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export function NavBar() {
  const [theme, setTheme] = useState<Theme>("dark");
  const { user } = useAuth();
  const pathname = usePathname();

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
      <Link href="/" className="font-bold tracking-tight text-[var(--ink)]" style={{ fontSize: "15px", letterSpacing: "-0.5px" }}>
        Electro
      </Link>

      <div className="flex items-center gap-1">
        {user && (
          <Link
            href="/catalog"
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/catalog"
                ? "text-[var(--ink)] bg-[var(--surface-2)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
            }`}
          >
            Catalog
          </Link>
        )}

        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
            title={user.email}
          >
            <span
              className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
              style={{
                width: "24px", height: "24px", fontSize: "10px",
                background: "var(--accent)",
              }}
            >
              {initials(user.name || user.email || "?")}
            </span>
            <span className="hidden sm:block max-w-[120px] truncate">
              {user.name || user.email}
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center justify-center w-9 h-9 rounded-md text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] active:opacity-70 transition-colors"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}
