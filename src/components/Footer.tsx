export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="no-print mt-16 border-t border-[var(--hairline)] px-4 sm:px-6 py-6"
      style={{ background: "var(--canvas)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-[var(--ink-subtle)] sm:flex-row">
        <span>© {year} Electro — Electrical quoting tool</span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/massirr/Electro"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://electro-quote.vercel.app"
            className="hover:text-[var(--ink)] transition-colors"
          >
            electro-quote.vercel.app
          </a>
        </div>
      </div>
    </footer>
  );
}
