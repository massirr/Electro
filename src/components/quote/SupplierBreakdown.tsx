import type { SupplierGroup } from "@/domain/types";

function fmt(n: number) {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

function exportCSV(groups: SupplierGroup[]) {
  const rows = [["Supplier", "SKU", "Name", "Qty", "Unit Price", "Total"]];
  for (const g of groups) {
    for (const l of g.lines) {
      rows.push([g.supplier, l.sku, l.name, String(l.quantity), l.unitPrice.toFixed(2), l.totalPrice.toFixed(2)]);
    }
  }
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplier-order.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function SupplierBreakdown({ groups }: { groups: SupplierGroup[] }) {
  const sorted = [...groups].sort((a, b) => a.supplier.localeCompare(b.supplier));

  return (
    <div>
      <div className="space-y-1">
        {sorted.map((g) => {
          const total = g.lines.reduce((s, l) => s + l.totalPrice, 0);
          return (
            <div key={g.supplier} className="flex justify-between text-sm py-2 border-b border-[var(--hairline)]">
              <span className="text-[var(--ink)]">{g.supplier}</span>
              <span className="tabular-nums text-[var(--ink)]">{fmt(total)}</span>
            </div>
          );
        })}
      </div>
      {sorted.length > 0 && (
        <button
          type="button"
          onClick={() => exportCSV(sorted)}
          className="no-print mt-3 text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] underline underline-offset-2 transition-colors"
        >
          Export CSV
        </button>
      )}
    </div>
  );
}
