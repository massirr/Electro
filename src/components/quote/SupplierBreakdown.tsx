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
          <div key={g.supplier} className="flex justify-between text-sm py-1 border-b border-[var(--border)]">
            <span>{g.supplier}</span>
            <span className="tabular-nums">{fmt(total)}</span>
          </div>
        );
      })}
    </div>
  );
}
