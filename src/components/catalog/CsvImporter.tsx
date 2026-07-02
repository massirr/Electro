"use client";

import { useRef, useState } from "react";

type Field = "sku" | "name" | "supplier" | "price" | "category" | "";

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

// ── CSV parser (handles , and ; delimiters, quoted fields, BOM) ──────────────

function detectDelimiter(line: string): string {
  const commas = (line.match(/,/g) ?? []).length;
  const semis  = (line.match(/;/g) ?? []).length;
  return semis >= commas ? ";" : ",";
}

function parseCSV(text: string): ParsedCSV {
  // Strip UTF-8 BOM if present (common in Belgian supplier exports)
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const delim = detectDelimiter(lines[0]);

  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delim && !inQuotes) {
        fields.push(field.trim()); field = "";
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine).filter(r => r.some(c => c));
  return { headers, rows };
}

// ── Smart field guessing based on column name keywords ───────────────────────

const HINTS: Record<Field, string[]> = {
  sku:      ["sku", "artikel", "code", "ref", "number", "nr", "id", "num", "art"],
  name:     ["naam", "name", "omschrijving", "description", "desc", "label", "benaming", "product", "titel"],
  price:    ["prijs", "price", "netto", "net", "tarief", "bedrag", "cost", "prix", "eenheidsprijs"],
  supplier: ["leverancier", "supplier", "merk", "brand", "fabrikant", "manufacturer", "vendor"],
  category: ["categorie", "category", "groep", "group", "type", "family", "klasse", "afdeling"],
  "":       [],
};

function guessField(header: string): Field {
  const h = header.toLowerCase();
  for (const [field, hints] of Object.entries(HINTS) as [Field, string[]][]) {
    if (field === "") continue;
    if (hints.some(hint => h.includes(hint))) return field;
  }
  return "";
}

// ── Component ─────────────────────────────────────────────────────────────────

type Stage = "idle" | "mapping" | "importing" | "done";

const FIELD_LABELS: Record<Field, string> = {
  sku: "SKU / Article #", name: "Name", supplier: "Supplier",
  price: "Price (€)", category: "Category", "": "— skip —",
};

const SUPPLIERS = [
  {
    name: "Cebeo",
    steps: [
      "Log in at b2b.cebeo.be",
      "Go to Export (top menu)",
      "Choose format CSV or XLSX — save as CSV",
      "Upload that file here",
    ],
  },
  {
    name: "Rexel",
    steps: [
      "Log in at rexel.be (Netstore)",
      "My account → Price list → Export",
      "Choose CSV format",
      "Upload that file here",
    ],
  },
];

function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--ink)]">How to get your price list</p>
        <button type="button" onClick={onClose} className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]">✕ Close</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {SUPPLIERS.map(({ name, steps }) => (
          <div key={name}>
            <p className="text-xs font-semibold text-[var(--ink-muted)] mb-2">{name}</p>
            <ol className="space-y-1">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-[var(--ink-subtle)]">
                  <span className="flex-shrink-0 font-medium text-[var(--accent)]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--ink-subtle)] border-t border-[var(--hairline)] pt-3">
        The importer handles both <strong>comma</strong> and <strong>semicolon</strong> delimiters and lets you map columns before importing. Existing products are updated by SKU — no duplicates.
      </p>
    </div>
  );
}

export function CsvImporter() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [showHelp, setShowHelp] = useState(false);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<Field[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const p = parseCSV(text);
      if (p.headers.length === 0) { setError("Could not parse file — make sure it's a CSV."); return; }
      const guesses = p.headers.map(h => guessField(h));
      setParsed(p);
      setMapping(guesses);
      setStage("mapping");
      setError(null);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  function mappedField(colIdx: number): Field { return mapping[colIdx] ?? ""; }

  function buildRows() {
    if (!parsed) return [];
    return parsed.rows.map(row => {
      const obj: Record<string, string> = {};
      mapping.forEach((field, i) => {
        if (field) obj[field] = row[i] ?? "";
      });
      return obj;
    });
  }

  const isMapped = mapping.includes("sku") && mapping.includes("name");
  const previewRows = parsed ? parsed.rows.slice(0, 4) : [];

  async function handleImport() {
    const rows = buildRows();
    setStage("importing");
    setError(null);
    try {
      const res = await fetch("/api/catalog/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Import failed"); setStage("mapping"); return; }
      setCount(json.count);
      setStage("done");
    } catch {
      setError("Import failed — please try again.");
      setStage("mapping");
    }
  }

  function reset() { setStage("idle"); setParsed(null); setMapping([]); setError(null); }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (stage === "idle") {
    return (
      <div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)] transition-colors"
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(h => !h)}
            aria-label="How to export from your supplier"
            title="How to export from your supplier"
            className={`w-6 h-6 rounded-full text-xs font-semibold border transition-colors flex items-center justify-center ${
              showHelp
                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                : "border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)]"
            }`}
          >
            ?
          </button>
        </div>
        {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
        {error && <p className="text-xs text-[var(--error)] mt-1">{error}</p>}
      </div>
    );
  }

  if (stage === "mapping" && parsed) {
    return (
      <div className="mt-4 rounded-lg border border-[var(--hairline)] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--ink)]">
            Map columns — {parsed.rows.length} rows detected
          </p>
          <button type="button" onClick={reset} className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]">Cancel</button>
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--hairline)]">
              <th className="py-1.5 text-left font-medium text-[var(--ink-muted)] pr-4">Column</th>
              <th className="py-1.5 text-left font-medium text-[var(--ink-muted)] pr-4">Sample</th>
              <th className="py-1.5 text-left font-medium text-[var(--ink-muted)]">Import as</th>
            </tr>
          </thead>
          <tbody>
            {parsed.headers.map((header, i) => (
              <tr key={i} className="border-b border-[var(--hairline)]">
                <td className="py-1.5 pr-4 text-[var(--ink)] font-medium">{header}</td>
                <td className="py-1.5 pr-4 text-[var(--ink-subtle)] max-w-[160px] truncate">
                  {previewRows.map(r => r[i]).filter(Boolean).slice(0, 2).join(", ")}
                </td>
                <td className="py-1.5">
                  <select
                    value={mapping[i] ?? ""}
                    onChange={e => {
                      const next = [...mapping];
                      next[i] = e.target.value as Field;
                      setMapping(next);
                    }}
                    className="text-xs bg-[var(--surface-2)] border border-[var(--hairline)] rounded px-2 py-1 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {(Object.keys(FIELD_LABELS) as Field[]).map(f => (
                      <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isMapped && (
          <p className="text-xs text-[var(--ink-subtle)]">Map at least <strong>SKU</strong> and <strong>Name</strong> to continue.</p>
        )}
        {error && <p className="text-xs text-[var(--error)]">{error}</p>}

        <button
          type="button"
          onClick={handleImport}
          disabled={!isMapped}
          className="text-sm font-medium px-5 py-2 rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Import {parsed.rows.length} products
        </button>
      </div>
    );
  }

  if (stage === "importing") {
    return (
      <div className="mt-4 text-xs text-[var(--ink-subtle)] py-4">Importing…</div>
    );
  }

  // done
  return (
    <div className="mt-4 rounded-lg border border-[var(--hairline)] p-4 flex items-center justify-between">
      <p className="text-sm text-[var(--ink)]">
        <span className="text-[#4caf75] font-medium">✓</span> {count} products imported
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]">Import another</button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs px-3 py-1.5 rounded bg-[var(--accent)] text-white hover:opacity-90"
        >
          Refresh catalog
        </button>
      </div>
    </div>
  );
}
