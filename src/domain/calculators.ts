import type {
  TakeoffItem,
  Product,
  Kit,
  LineItem,
  QuoteResult,
  SupplierGroup,
  QuoteSettings,
} from "./types";

export function calcLaborTotal(items: TakeoffItem[], hourlyRate: number): number {
  const totalHours = items.reduce(
    (sum, item) => sum + item.quantity * item.hoursPerUnit,
    0
  );
  return Math.round(totalHours * hourlyRate * 100) / 100;
}

export function expandKits(
  items: TakeoffItem[],
  kits: Kit[],
  catalog: Map<string, Product>
): LineItem[] {
  const kitMap = new Map(kits.map((k) => [k.takeoffId, k]));
  const skuTotals = new Map<string, number>();

  for (const item of items) {
    const kit = kitMap.get(item.id);
    if (!kit) continue;
    for (const comp of kit.components) {
      const existing = skuTotals.get(comp.sku) ?? 0;
      skuTotals.set(comp.sku, existing + comp.quantityPerUnit * item.quantity);
    }
  }

  const lineItems: LineItem[] = [];
  for (const [sku, qty] of skuTotals.entries()) {
    const product = catalog.get(sku);
    if (!product) continue;
    lineItems.push({
      sku,
      name: product.name,
      supplier: product.supplier,
      quantity: qty,
      unitPrice: product.price,
      totalPrice: Math.round(qty * product.price * 100) / 100,
    });
  }

  return lineItems;
}

export function calcMaterialTotal(lineItems: LineItem[]): number {
  return Math.round(
    lineItems.reduce((sum, li) => sum + li.totalPrice, 0) * 100
  ) / 100;
}

export function applyMargin(subtotal: number, marginPercent: number): number {
  return Math.round(subtotal * (marginPercent / 100) * 100) / 100;
}

export function applyVAT(amount: number, vatPercent: number): number {
  return Math.round(amount * (vatPercent / 100) * 100) / 100;
}

export function buildQuote(
  items: TakeoffItem[],
  kits: Kit[],
  catalog: Map<string, Product>,
  settings: QuoteSettings
): QuoteResult {
  const lineItems = expandKits(items, kits, catalog);
  const laborTotal = calcLaborTotal(items, settings.hourlyRate);
  const materialTotal = calcMaterialTotal(lineItems);
  const subtotal = Math.round((laborTotal + materialTotal) * 100) / 100;
  const margin = applyMargin(subtotal, settings.marginPercent);
  const vat = applyVAT(subtotal + margin, settings.vatPercent);
  const grandTotal =
    Math.round((subtotal + margin + vat) * 100) / 100;

  return { laborTotal, materialTotal, subtotal, margin, vat, grandTotal, lineItems };
}

export function groupBySupplier(lineItems: LineItem[]): SupplierGroup[] {
  const groups = new Map<string, LineItem[]>();
  for (const line of lineItems) {
    const existing = groups.get(line.supplier) ?? [];
    existing.push(line);
    groups.set(line.supplier, existing);
  }
  return Array.from(groups.entries()).map(([supplier, lines]) => ({
    supplier,
    lines,
  }));
}
