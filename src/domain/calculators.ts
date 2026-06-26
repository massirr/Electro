import type {
  TakeoffItem,
  Product,
  Kit,
  LineItem,
  QuoteResult,
  SupplierGroup,
  QuoteSettings,
  JobType,
} from "./types";

const LABOR_VAT_RATES: Record<JobType, number> = {
  renovation: 0.06,
  "new-build": 0.21,
};

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
  const totalWithMargin = Math.round((subtotal + margin) * 100) / 100;

  // Distribute margin proportionally, then apply separate VAT rates
  const laborBase = subtotal > 0
    ? Math.round((totalWithMargin * (laborTotal / subtotal)) * 100) / 100
    : 0;
  const materialBase = Math.round((totalWithMargin - laborBase) * 100) / 100;

  const laborVatRate = LABOR_VAT_RATES[settings.jobType];
  const laborVat = Math.round(laborBase * laborVatRate * 100) / 100;
  const materialVat = Math.round(materialBase * 0.06 * 100) / 100;
  const grandTotal = Math.round((totalWithMargin + laborVat + materialVat) * 100) / 100;

  return {
    jobType: settings.jobType,
    laborTotal,
    materialTotal,
    subtotal,
    margin,
    laborVat,
    materialVat,
    grandTotal,
    lineItems,
  };
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
