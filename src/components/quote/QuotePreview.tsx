import type { QuoteResult } from "@/domain/types";
import { groupBySupplier } from "@/domain/calculators";
import { SupplierBreakdown } from "./SupplierBreakdown";
import { LineItemsTable } from "./LineItemsTable";

function fmt(n: number) {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-muted)] mb-3">
      {children}
    </h2>
  );
}

interface QuotePreviewProps {
  quote: QuoteResult;
  projectName?: string;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  electricianName?: string;
  electricianBtw?: string;
}

export function QuotePreview({
  quote,
  projectName,
  customerName,
  customerEmail,
  customerAddress,
  electricianName,
  electricianBtw,
}: QuotePreviewProps) {
  const groups = groupBySupplier(quote.lineItems);
  const laborVatPct = quote.jobType === "renovation" ? "6%" : "21%";
  const today = new Date().toLocaleDateString("fr-BE");

  const summaryRows: [string, number][] = [
    ["Labor", quote.laborTotal],
    ["Materials", quote.materialTotal],
    ["Subtotal", quote.subtotal],
    ["Margin 15%", quote.margin],
    [`Labor VAT ${laborVatPct}`, quote.laborVat],
    ["Materials VAT 6%", quote.materialVat],
  ];

  return (
    <div className="space-y-8">
      {/* Print header — hidden on screen, shown when printing */}
      <div className="hidden print:block mb-8 pb-6 border-b border-gray-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xl font-bold text-black">{electricianName || "Electro"}</div>
            {electricianBtw && <div className="text-sm text-gray-600">BTW: {electricianBtw}</div>}
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Offerte datum: {today}</div>
            {projectName && <div>Ref: {projectName}</div>}
          </div>
        </div>
        {(customerName || customerEmail || customerAddress) && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <div className="text-xs font-semibold uppercase text-gray-400 mb-2">Klant</div>
            {customerName && <div className="text-sm font-medium text-black">{customerName}</div>}
            {customerEmail && <div className="text-sm text-gray-600">{customerEmail}</div>}
            {customerAddress && <div className="text-sm text-gray-600 whitespace-pre-line">{customerAddress}</div>}
          </div>
        )}
      </div>

      {/* Print button — hidden when printing */}
      <div className="no-print flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-[var(--hairline-strong)] transition-colors"
        >
          Print / PDF
        </button>
      </div>

      {/* Summary totals */}
      <section>
        <SectionLabel>Quote Summary</SectionLabel>
        <div className="bg-[var(--surface-2)] rounded-md p-5 space-y-0 print:bg-white print:border print:border-gray-200" style={{ border: "1px solid var(--hairline)" }}>
          {summaryRows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between py-2 text-sm border-b border-[var(--hairline)] print:border-gray-200"
            >
              <span className="text-[var(--ink-muted)] print:text-gray-600">{label}</span>
              <span className="tabular-nums text-[var(--ink)] print:text-black">{fmt(value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-4 mt-1">
            <span className="text-sm font-medium text-[var(--ink-muted)] print:text-gray-700">Grand Total</span>
            <span
              className="tabular-nums font-semibold text-[var(--accent)] print:text-black"
              style={{ fontSize: "24px", letterSpacing: "-0.4px" }}
            >
              {fmt(quote.grandTotal)}
            </span>
          </div>
        </div>
      </section>

      {/* Supplier breakdown */}
      <section>
        <SectionLabel>By Supplier</SectionLabel>
        <SupplierBreakdown groups={groups} />
      </section>

      {/* Line items */}
      <section>
        <SectionLabel>Line Items</SectionLabel>
        <LineItemsTable items={quote.lineItems} />
      </section>
    </div>
  );
}
