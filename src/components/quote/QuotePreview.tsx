import type { QuoteResult } from "@/domain/types";
import { groupBySupplier } from "@/domain/calculators";
import { SupplierBreakdown } from "./SupplierBreakdown";
import { LineItemsTable } from "./LineItemsTable";

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">
      {children}
    </h2>
  );
}

export function QuotePreview({ quote }: { quote: QuoteResult }) {
  const groups = groupBySupplier(quote.lineItems);

  const rows: [string, number][] = [
    ["Labor", quote.laborTotal],
    ["Materials", quote.materialTotal],
    ["Subtotal", quote.subtotal],
    ["Margin 15%", quote.margin],
    ["VAT 21%", quote.vat],
  ];

  return (
    <div className="space-y-8">
      {/* Summary totals */}
      <section>
        <SectionLabel>Quote Summary</SectionLabel>
        <div className="bg-[var(--surface)] rounded-lg p-5 space-y-0">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between py-2 text-sm border-b border-[var(--border)]"
            >
              <span className="text-[var(--muted)]">{label}</span>
              <span className="tabular-nums">{fmt(value)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-4 text-base font-bold">
            <span>Grand Total</span>
            <span className="tabular-nums text-[var(--accent)]">{fmt(quote.grandTotal)}</span>
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
