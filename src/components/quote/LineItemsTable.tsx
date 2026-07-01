import type { LineItem } from "@/domain/types";

function fmt(n: number) {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

export function LineItemsTable({ items }: { items: LineItem[] }) {
  const sorted = [...items].sort((a, b) =>
    a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name)
  );

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--hairline)] print:border-gray-200">
            {["SKU", "Name", "Supplier", "Qty", "Unit", "Total"].map((h) => (
              <th
                key={h}
                className="py-2 px-1 print:py-1 text-left font-medium text-[var(--ink-muted)] print:text-gray-600 first:pl-0 last:pr-0 last:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((li) => (
            <tr key={li.sku} className="border-b border-[var(--hairline)] print:border-gray-200 print:break-inside-avoid">
              <td className="py-2 px-1 print:py-1 pl-0 font-mono text-xs text-[var(--ink-subtle)] print:text-gray-500">{li.sku}</td>
              <td className="py-2 px-1 print:py-1 text-[var(--ink)] print:text-black">{li.name}</td>
              <td className="py-2 px-1 print:py-1 text-[var(--ink-muted)] print:text-gray-600">{li.supplier}</td>
              <td className="py-2 px-1 print:py-1 tabular-nums print:text-black">{li.quantity}</td>
              <td className="py-2 px-1 print:py-1 tabular-nums print:text-black">{fmt(li.unitPrice)}</td>
              <td className="py-2 px-1 print:py-1 pr-0 text-right tabular-nums print:text-black">{fmt(li.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
