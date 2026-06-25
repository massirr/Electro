import type { SupplierGroup } from "@/domain/types";

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function SupplierBreakdown({ groups }: { groups: SupplierGroup[] }) {
  const sorted = [...groups].sort((a, b) => a.supplier.localeCompare(b.supplier));

  return (
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
  );
}
