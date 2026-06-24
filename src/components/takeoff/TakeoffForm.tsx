"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CatalogItem } from "@/app/api/catalog/route";
import type { TakeoffItem } from "@/domain/types";
import { useQuote } from "@/hooks/useQuote";
import { QuotePreview } from "@/components/quote/QuotePreview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormRow {
  key: string;
  id: string;
  name: string;
  quantity: number;
  hoursPerUnit: number;
  isDefault: boolean;
}

function blankRow(key: string): FormRow {
  return { key, id: "", name: "", quantity: 0, hoursPerUnit: 0, isDefault: false };
}

const LS_KEY = "electro-takeoff-rows";

// ─── ItemCombobox ──────────────────────────────────────────────────────────────

function ItemCombobox({
  items,
  value,
  onChange,
  disabled,
  rowIndex,
  autoFocus,
  nextRef,
}: {
  items: CatalogItem[];
  value: string;
  onChange: (item: CatalogItem) => void;
  disabled?: boolean;
  rowIndex: number;
  autoFocus?: boolean;
  nextRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = `item-listbox-${rowIndex}`;

  const selected = items.find((i) => i.id === value);
  const filtered = query
    ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
  }

  function closeDropdown() {
    setOpen(false);
    setQuery("");
  }

  function handleSelect(item: CatalogItem) {
    onChange(item);
    closeDropdown();
    nextRef?.current?.focus();
  }

  // Focus filter input when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) closeDropdown();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`Item, row ${rowIndex + 1}`}
        disabled={disabled}
        autoFocus={autoFocus}
        className="w-full text-left text-sm px-3 py-2 bg-[var(--surface)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDropdown();
          }
          if (e.key === "Escape") closeDropdown();
        }}
      >
        <span className={selected ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
          {disabled ? "Loading…" : selected ? selected.name : "Search items…"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search items…"
            className="w-full px-3 py-2 text-sm bg-transparent border-b border-[var(--border)] outline-none text-[var(--foreground)] placeholder:text-[var(--muted)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeDropdown();
              if (e.key === "Enter" && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <ul id={listboxId} role="listbox" className="max-h-48 overflow-y-auto py-1">
            {filtered.map((item) => (
              <li
                key={item.id}
                role="option"
                aria-selected={item.id === value}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--border)] aria-selected:text-[var(--accent)]"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  handleSelect(item);
                }}
              >
                {item.name}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-[var(--muted)]">No items found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── TakeoffForm ───────────────────────────────────────────────────────────────

export function TakeoffForm() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const nextKeyRef = useRef(2);
  function nextKey() { return String(nextKeyRef.current++); }
  const [rows, setRows] = useState<FormRow[]>(() => [blankRow("1")]);

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  function qtyRefFor(key: string): React.RefObject<HTMLInputElement | null> {
    return { get current() { return inputRefs.current.get(`${key}-qty`) ?? null; } };
  }

  // Catalog fetch
  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data: CatalogItem[]) => {
        setCatalog(data);
        setCatalogLoading(false);
      })
      .catch(() => setCatalogLoading(false));
  }, []);

  // Restore from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed: FormRow[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRows(parsed);
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {
      // ignore storage errors
    }
  }, [rows]);

  // useQuote consumes TakeoffItem[] — map from FormRow
  const takeoffItems: TakeoffItem[] = rows
    .filter((r) => r.id !== "")
    .map((r) => ({ id: r.id, name: r.name, quantity: r.quantity, hoursPerUnit: r.hoursPerUnit }));

  const { quote, isLoading: quoteLoading, error: quoteError } = useQuote(takeoffItems);

  // ── Row mutations ────────────────────────────────────────────────────────────

  const updateRow = useCallback((key: string, patch: Partial<FormRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== key);
      return next.length === 0 ? [blankRow(nextKey())] : next;
    });
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, blankRow(nextKey())]);
  }, []);

  function handleItemSelect(rowKey: string, item: CatalogItem) {
    updateRow(rowKey, {
      id: item.id,
      name: item.name,
      hoursPerUnit: item.defaultHu,
      isDefault: true,
    });
  }

  function handleQtyChange(rowKey: string, val: string) {
    updateRow(rowKey, { quantity: parseFloat(val) || 0 });
  }

  function handleHuChange(rowKey: string, val: string) {
    updateRow(rowKey, { hoursPerUnit: parseFloat(val) || 0, isDefault: false });
  }

  function handleHuKeyDown(e: React.KeyboardEvent, rowKey: string) {
    if (e.key === "Enter") {
      const isLast = rows[rows.length - 1].key === rowKey;
      if (isLast) addRow();
      // Focus is handled by tabbing to next row's combobox naturally
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10">
      {/* Left: Takeoff table */}
      <section>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">
          Takeoff
        </h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="py-2 text-left font-medium text-[var(--muted)]">Item</th>
              <th className="py-2 text-right font-medium text-[var(--muted)] w-20">Qty</th>
              <th className="py-2 text-right font-medium text-[var(--muted)] w-20">h/u</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const qtyInputId = `${row.key}-qty`;
              const huInputId = `${row.key}-hu`;
              return (
                <tr key={row.key} className="group border-b border-[var(--border)]">
                  <td className="py-1.5 pr-2">
                    <ItemCombobox
                      items={catalog}
                      value={row.id}
                      onChange={(item) => handleItemSelect(row.key, item)}
                      disabled={catalogLoading}
                      rowIndex={idx}
                      autoFocus={idx === 0}
                      nextRef={qtyRefFor(row.key)}
                    />
                  </td>
                  <td className="py-1.5 px-1 w-20">
                    <input
                      id={qtyInputId}
                      ref={(el) => {
                        if (el) inputRefs.current.set(qtyInputId, el);
                        else inputRefs.current.delete(qtyInputId);
                      }}
                      type="number"
                      min="0"
                      step="any"
                      aria-label="Quantity"
                      disabled={!row.id}
                      value={row.id ? row.quantity || "" : ""}
                      placeholder={row.id ? "" : "—"}
                      onChange={(e) => handleQtyChange(row.key, e.target.value)}
                      className="w-full text-right text-sm px-2 py-2 bg-[var(--surface)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-30 [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden tabular-nums"
                    />
                  </td>
                  <td className="py-1.5 px-1 w-20">
                    <input
                      id={huInputId}
                      ref={(el) => {
                        if (el) inputRefs.current.set(huInputId, el);
                        else inputRefs.current.delete(huInputId);
                      }}
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Hours per unit"
                      disabled={!row.id}
                      value={row.id ? row.hoursPerUnit || "" : ""}
                      placeholder={row.id ? "" : "—"}
                      onChange={(e) => handleHuChange(row.key, e.target.value)}
                      onKeyDown={(e) => handleHuKeyDown(e, row.key)}
                      className={`w-full text-right text-sm px-2 py-2 bg-[var(--surface)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-30 [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden tabular-nums ${
                        row.isDefault ? "text-[#62666d]" : "text-[var(--foreground)]"
                      }`}
                    />
                  </td>
                  <td className="py-1.5 w-8 text-center">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Remove row ${idx + 1}`}
                      onClick={() => removeRow(row.key)}
                      className="opacity-0 group-hover:opacity-100 text-[#62666d] hover:text-[var(--foreground)] transition-opacity text-base leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          type="button"
          onClick={addRow}
          className="mt-3 text-xs text-[var(--muted)] hover:text-[var(--foreground)] text-left transition-colors"
        >
          + Add item
        </button>
      </section>

      {/* Right: Quote panel */}
      <section>
        <div className={quoteLoading ? "opacity-50 transition-opacity" : "transition-opacity"}>
          {quoteError && (
            <p className="text-xs text-[var(--error)] mb-2">{quoteError}</p>
          )}
          {quote ? (
            <QuotePreview quote={quote} />
          ) : (
            <div className="text-sm text-[var(--muted)] pt-8">
              Add items to see the quote.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
