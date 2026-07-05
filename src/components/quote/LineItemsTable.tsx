import type { LineItem } from "@/domain/types";
import { sortLineItems } from "@/domain/calculators";
import { formatCurrency as fmt } from "@/lib/format";

export function LineItemsTable({ items }: { items: LineItem[] }) {
  const sorted = sortLineItems(items);

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--hairline)] print:border-gray-200">
            <th className="py-2 px-1 print:py-1 pl-0 text-left font-medium text-[var(--ink-muted)] print:text-gray-600">SKU</th>
            <th className="py-2 px-1 print:py-1 text-left font-medium text-[var(--ink-muted)] print:text-gray-600">Name</th>
            <th className="py-2 px-1 print:py-1 text-left font-medium text-[var(--ink-muted)] print:text-gray-600">Supplier</th>
            <th className="py-2 px-1 print:py-1 text-left font-medium text-[var(--ink-muted)] print:text-gray-600">Qty</th>
            <th className="py-2 px-1 print:py-1 text-left font-medium text-[var(--ink-muted)] print:hidden">Unit</th>
            <th className="py-2 px-1 print:py-1 pr-0 text-right font-medium text-[var(--ink-muted)] print:text-gray-600">Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((li) => (
            <tr key={li.sku} className="border-b border-[var(--hairline)] print:border-gray-200 print:break-inside-avoid">
              <td className="py-2 px-1 print:py-1 pl-0 font-mono text-xs text-[var(--ink-subtle)] print:text-gray-500">{li.sku}</td>
              <td className="py-2 px-1 print:py-1 text-[var(--ink)] print:text-black">{li.name}</td>
              <td className="py-2 px-1 print:py-1 text-[var(--ink-muted)] print:text-gray-600">{li.supplier}</td>
              <td className="py-2 px-1 print:py-1 tabular-nums print:text-black">{li.quantity}</td>
              <td className="py-2 px-1 print:py-1 tabular-nums print:hidden">{fmt(li.unitPrice)}</td>
              <td className="py-2 px-1 print:py-1 pr-0 text-right tabular-nums print:text-black">{fmt(li.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
