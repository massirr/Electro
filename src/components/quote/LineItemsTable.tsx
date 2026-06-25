import type { LineItem } from "@/domain/types";

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function LineItemsTable({ items }: { items: LineItem[] }) {
  const sorted = [...items].sort((a, b) =>
    a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--hairline)]">
            {["SKU", "Name", "Supplier", "Qty", "Unit", "Total"].map((h) => (
              <th
                key={h}
                className="py-2 px-1 text-left font-medium text-[var(--ink-muted)] first:pl-0 last:pr-0 last:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((li) => (
            <tr key={li.sku} className="border-b border-[var(--hairline)]">
              <td className="py-2 px-1 pl-0 font-mono text-xs text-[var(--ink-subtle)]">{li.sku}</td>
              <td className="py-2 px-1 text-[var(--ink)]">{li.name}</td>
              <td className="py-2 px-1 text-[var(--ink-muted)]">{li.supplier}</td>
              <td className="py-2 px-1 tabular-nums">{li.quantity}</td>
              <td className="py-2 px-1 tabular-nums">{fmt(li.unitPrice)}</td>
              <td className="py-2 px-1 pr-0 text-right tabular-nums">{fmt(li.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
