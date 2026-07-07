"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { CatalogItem } from "@/app/api/catalog/route";
import type { JobType, TakeoffItem } from "@/domain/types";
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

interface LoadTarget {
  project: {
    name: string;
    jobType: JobType;
    hourlyRate: number;
    marginPercent: number;
    customerName?: string;
    customerEmail?: string;
    customerAddress?: string;
    validityDays?: number;
    deliveryDate?: string | null;
    customerReference?: string;
  };
  items: Array<{
    externalItemId: string;
    name: string;
    quantity: number;
    hoursPerUnit: number;
  }>;
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
        className="w-full text-left text-sm px-3 py-2 min-h-[44px] sm:min-h-0 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md hover:border-[var(--hairline-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDropdown();
          }
          if (e.key === "Escape") closeDropdown();
        }}
      >
        <span className={`block truncate ${selected ? "text-[var(--ink)]" : "text-[var(--ink-subtle)]"}`}>
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
                className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-2)] aria-selected:text-[var(--accent)]"
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

export function TakeoffForm({
  loadTarget,
  onSaved,
  userId,
  initialHourlyRate = 85,
  electricianName,
  electricianBtw,
}: {
  loadTarget: LoadTarget | null;
  onSaved: () => void;
  userId?: string;
  initialHourlyRate?: number;
  electricianName?: string;
  electricianBtw?: string;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const nextKeyRef = useRef(2);
  function nextKey() { return String(nextKeyRef.current++); }
  const [rows, setRows] = useState<FormRow[]>(() => [blankRow("1")]);

  // Quote settings
  const [projectName, setProjectName] = useState("");
  const [jobType, setJobType] = useState<JobType>("new-build");
  const [hourlyRate] = useState(initialHourlyRate);
  const [marginPercent] = useState(15);

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [validityDays, setValidityDays] = useState(30);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [customerReference, setCustomerReference] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

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

  // Load a saved quote into the form
  useEffect(() => {
    if (!loadTarget) return;
    const { project, items } = loadTarget;
    setProjectName(project.name);
    setJobType(project.jobType);
    setCustomerName(project.customerName ?? "");
    setCustomerEmail(project.customerEmail ?? "");
    setCustomerAddress(project.customerAddress ?? "");
    setValidityDays(project.validityDays ?? 30);
    setDeliveryDate(project.deliveryDate ?? "");
    setCustomerReference(project.customerReference ?? "");
    const newRows = items.map((item) => ({
      key: String(nextKeyRef.current++),
      id: item.externalItemId,
      name: item.name,
      quantity: item.quantity,
      hoursPerUnit: item.hoursPerUnit,
      isDefault: false,
    }));
    setRows(newRows.length > 0 ? newRows : [blankRow(nextKey())]);
    setSaveOk(false);
    setSaveError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTarget]);

  const settings = useMemo(
    () => ({ hourlyRate, jobType, marginPercent }),
    [hourlyRate, jobType, marginPercent]
  );

  // Memoized so reference stays stable between renders that don't change row data.
  // Without useMemo, a new array is created every render → useQuote effect fires → POST spam.
  const takeoffItems = useMemo(
    () =>
      rows
        .filter((r) => r.id !== "")
        .map((r): TakeoffItem => ({ id: r.id, name: r.name, quantity: r.quantity, hoursPerUnit: r.hoursPerUnit })),
    [rows]
  );

  const { quote, isLoading: quoteLoading, error: quoteError } = useQuote(takeoffItems, settings);

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

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!projectName.trim()) { setSaveError("Project name required"); return; }
    if (takeoffItems.length === 0) { setSaveError("Add at least one item"); return; }
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          jobType,
          hourlyRate,
          marginPercent,
          rows: takeoffItems,
          owner: userId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerAddress: customerAddress.trim(),
          validityDays,
          deliveryDate: deliveryDate || null,
          customerReference: customerReference.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as { error?: string }).error ?? "Save failed");
        return;
      }
      setSaveOk(true);
      onSaved();
    } catch {
      setSaveError("Save failed — is PocketBase running?");
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6">
      {/* Left: Takeoff table */}
      <section
        className="no-print rounded-lg p-4 sm:p-6"
        style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", boxShadow: "var(--card-shadow)" }}
      >
        <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-muted)] mb-4">
          Takeoff
        </h2>

        {/* Project name */}
        <input
          type="text"
          placeholder="Project name…"
          value={projectName}
          onChange={(e) => { setProjectName(e.target.value); setSaveOk(false); }}
          className="w-full text-sm px-3 py-2 mb-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
        />

        {/* Customer info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <input
            type="text"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); setSaveOk(false); }}
            className="text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
          />
          <input
            type="email"
            placeholder="Customer email"
            value={customerEmail}
            onChange={(e) => { setCustomerEmail(e.target.value); setSaveOk(false); }}
            className="text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
          />
        </div>
        <input
          type="text"
          placeholder="Customer address"
          value={customerAddress}
          onChange={(e) => { setCustomerAddress(e.target.value); setSaveOk(false); }}
          className="w-full text-sm px-3 py-2 mb-3 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
        />

        {/* Quote metadata (shown on the PDF letterhead) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-[var(--ink-subtle)]">Validity (days)</span>
            <input
              type="number"
              min="1"
              value={validityDays}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                setValidityDays(Number.isNaN(parsed) ? 30 : parsed);
                setSaveOk(false);
              }}
              className="text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-[var(--ink-subtle)]">Delivery date</span>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => { setDeliveryDate(e.target.value); setSaveOk(false); }}
              className="text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-[var(--ink-subtle)]">Customer reference</span>
            <input
              type="text"
              placeholder="Optional"
              value={customerReference}
              onChange={(e) => { setCustomerReference(e.target.value); setSaveOk(false); }}
              className="text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
            />
          </label>
        </div>

        {/* Job type toggle */}
        <div className="flex gap-1 mb-4">
          {(["renovation", "new-build"] as const).map((jt) => (
            <button
              key={jt}
              type="button"
              onClick={() => setJobType(jt)}
              className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
                jobType === jt
                  ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                  : "border-[var(--hairline)] text-[var(--ink-subtle)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink)]"
              }`}
            >
              {jt === "renovation" ? "Renovation (6%)" : "New build (21%)"}
            </button>
          ))}
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="py-2 text-left font-medium text-[var(--ink-muted)]">Item</th>
              <th className="py-2 text-right font-medium text-[var(--ink-muted)] w-16">Qty</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const qtyInputId = `${row.key}-qty`;
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
                  <td className="py-1.5 px-1 w-16">
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
                      onKeyDown={(e) => { if (e.key === "Enter" && rows[rows.length - 1].key === row.key) addRow(); }}
                      className="w-full text-right text-sm px-2 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--hairline-strong)] transition-colors disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden tabular-nums"
                    />
                  </td>
                  <td className="py-1.5 w-8 text-center">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Remove row ${idx + 1}`}
                      onClick={() => removeRow(row.key)}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-[#62666d] hover:text-[var(--foreground)] transition-opacity text-base leading-none p-1"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 flex items-center">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs font-medium text-[var(--ink-subtle)] border border-[var(--hairline)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)] rounded-md px-3 py-1.5 transition-colors"
          >
            + Add item
          </button>
        </div>

        {/* Save area */}
        <div className="mt-4 pt-4 border-t border-[var(--hairline)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-medium px-5 py-3 sm:py-2 rounded-md bg-[var(--accent)] text-white hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-50 min-h-[44px] sm:min-h-0"
            >
              {saving ? "Saving…" : "Save quote"}
            </button>
            {saveOk && <span className="text-xs text-[#4caf75]">Saved</span>}
            {saveError && <span className="text-xs text-[#e5533d]">{saveError}</span>}
          </div>
        </div>
      </section>

      {/* Right: Quote panel */}
      <section
        className="rounded-lg"
        style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", boxShadow: "var(--card-shadow)" }}
      >
        <div className={`p-6 transition-opacity ${quoteLoading && !quote ? "opacity-50" : ""}`}>
          {quoteError && (
            <p className="text-xs text-[var(--error)] mb-2">{quoteError}</p>
          )}
          {quote ? (
            <QuotePreview
              quote={quote}
              projectName={projectName}
              customerName={customerName}
              customerEmail={customerEmail}
              customerAddress={customerAddress}
              electricianName={electricianName}
              electricianBtw={electricianBtw}
            />
          ) : (
            <div className="flex flex-col justify-center h-full min-h-[220px] gap-6 py-6">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)] mb-1">Your quote will appear here</p>
                <p className="text-xs text-[var(--ink-subtle)]">Add items on the left to generate a full breakdown.</p>
              </div>
              <ol className="space-y-3">
                {[
                  { n: "1", label: "Pick an item", detail: "Click the dropdown and start typing — e.g. \"outlet\" or \"breaker\"" },
                  { n: "2", label: "Enter quantity", detail: "How many of that item does this job need?" },
                  { n: "3", label: "Save the quote", detail: "A full breakdown with labour, materials & VAT is ready to print or email" },
                ].map(({ n, label, detail }) => (
                  <li key={n} className="flex gap-3">
                    <span
                      className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-semibold text-[10px] mt-0.5"
                      style={{ width: "20px", height: "20px", background: "var(--accent)", opacity: 0.85 }}
                    >
                      {n}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[var(--ink-muted)]">{label}</p>
                      <p className="text-xs text-[var(--ink-subtle)]">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
