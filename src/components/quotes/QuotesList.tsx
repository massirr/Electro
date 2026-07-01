"use client";

import { useEffect, useState } from "react";

interface SavedQuote {
  id: string;
  name: string;
  projectDate: string;
  grandTotal: number;
}

function fmt(n: number) {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

export function QuotesList({
  refreshKey,
  onLoad,
  onDelete,
  onDuplicate,
  userId,
}: {
  refreshKey: number;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  userId?: string;
}) {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = userId ? `/api/quotes?owner=${encodeURIComponent(userId)}` : "/api/quotes";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setQuotes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey, userId]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    onDelete(id);
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    await fetch(`/api/quotes/${id}/duplicate`, { method: "POST" });
    setDuplicatingId(null);
    onDuplicate(id);
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", boxShadow: "var(--card-shadow)" }}
    >
      <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-muted)] mb-3">
        Saved Quotes
      </h2>

      {loading ? (
        <p className="text-xs text-[var(--ink-subtle)]">Loading…</p>
      ) : quotes.length === 0 ? (
        <p className="text-xs text-[var(--ink-subtle)]">No saved quotes yet.</p>
      ) : (
        <ul className="space-y-2">
          {quotes.map((q) => (
            <li
              key={q.id}
              className="rounded-md p-3 text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
            >
              <div className="font-medium text-[var(--ink)] truncate mb-0.5">{q.name}</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[var(--ink-muted)]">{q.projectDate}</span>
                <span className="tabular-nums text-xs text-[var(--accent)]">{fmt(q.grandTotal)}</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onLoad(q.id)}
                  className="flex-1 text-xs px-2 py-2 sm:py-1 min-h-[40px] sm:min-h-0 rounded border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)] active:opacity-70 transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDuplicate(q.id)}
                  disabled={duplicatingId === q.id}
                  title="Duplicate"
                  className="text-xs px-3 py-2 sm:py-1 min-h-[40px] sm:min-h-0 rounded border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)] active:opacity-70 transition-colors disabled:opacity-40"
                >
                  ⧉
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={deletingId === q.id}
                  className="text-xs px-3 py-2 sm:py-1 min-h-[40px] sm:min-h-0 rounded border border-[var(--hairline)] text-[#e5533d] hover:border-[#e5533d] active:opacity-70 transition-colors disabled:opacity-40"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
