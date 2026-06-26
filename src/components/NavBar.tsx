"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function NavBar() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = document.documentElement.classList.contains("light")
      ? "light"
      : "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    try {
      localStorage.setItem("electro-theme", next);
    } catch {}
  }

  return (
    <nav
      className="sticky top-0 z-10 h-14 flex items-center justify-between px-6 border-b border-[var(--hairline)]"
      style={{ background: "var(--canvas)", transition: "background 0.15s ease" }}
    >
      <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">
        Electro
      </span>
      <button
        type="button"
        onClick={toggle}
        className="text-xs font-medium px-3 py-2 min-h-[40px] rounded-md border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)] active:opacity-70 transition-colors"
      >
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </nav>
  );
}
