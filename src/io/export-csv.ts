import type { QuoteResult, SupplierGroup } from "../domain/types";

export function exportQuoteCsv(quote: QuoteResult): string {
  const header = "sku,name,supplier,quantity,unit_price,total_price";
  const rows = quote.lineItems.map(
    (li) =>
      `${li.sku},${JSON.stringify(li.name)},${li.supplier},${li.quantity},${li.unitPrice},${li.totalPrice}`
  );
  return [header, ...rows].join("\n");
}

export function exportSupplierCsv(group: SupplierGroup): string {
  const header = "sku,name,quantity,unit_price,total_price";
  const rows = group.lines.map(
    (li) =>
      `${li.sku},${JSON.stringify(li.name)},${li.quantity},${li.unitPrice},${li.totalPrice}`
  );
  return [header, ...rows].join("\n");
}
