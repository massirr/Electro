import type { Product } from "../domain/types";

export async function loadCatalog(filePath: string): Promise<Map<string, Product>> {
  const text = await Bun.file(filePath).text();
  const lines = text.trim().split("\n");
  const catalog = new Map<string, Product>();

  for (const line of lines.slice(1)) {
    const [sku, name, supplier, priceStr, category] = line.split(",");
    if (!sku) continue;
    catalog.set(sku.trim(), {
      sku: sku.trim(),
      name: name.trim(),
      supplier: supplier.trim(),
      price: parseFloat(priceStr),
      category: category.trim(),
    });
  }

  return catalog;
}
