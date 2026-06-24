import { resolve } from "path";
import { pb, authenticateAdmin } from "../src/io/pocketbase-admin";
import { loadCatalog } from "../src/io/load-catalog";
import { loadKits } from "../src/io/load-kits";

const DATA = resolve(import.meta.dirname, "../data/sample-inputs");

await authenticateAdmin();

const catalog = await loadCatalog(`${DATA}/sample-catalog.csv`);
const kits = await loadKits(`${DATA}/sample-kits.json`);

// Seed products
console.log("Seeding products...");
const productIdMap = new Map<string, string>(); // sku → PocketBase record ID

for (const [sku, product] of catalog.entries()) {
  // Skip if already exists
  try {
    const existing = await pb.collection("products").getFirstListItem(`sku="${sku}"`);
    productIdMap.set(sku, existing.id);
  } catch {
    const record = await pb.collection("products").create({
      sku: product.sku,
      name: product.name,
      supplier: product.supplier,
      price: product.price,
      category: product.category,
    });
    productIdMap.set(sku, record.id);
  }
}

console.log(`  ${productIdMap.size} products seeded`);

// Seed item_kits
console.log("Seeding item_kits...");
let kitCount = 0;

for (const kit of kits) {
  for (const component of kit.components) {
    const productId = productIdMap.get(component.sku);
    if (!productId) {
      console.warn(`  SKU not found in catalog: ${component.sku}`);
      continue;
    }

    try {
      await pb.collection("item_kits").getFirstListItem(
        `takeoffExternalItemId="${kit.takeoffId}" && product="${productId}"`
      );
    } catch {
      await pb.collection("item_kits").create({
        takeoffExternalItemId: kit.takeoffId,
        product: productId,
        quantityPerUnit: component.quantityPerUnit,
      });
      kitCount++;
    }
  }
}

console.log(`  ${kitCount} kit lines seeded`);
console.log("Seed complete.");
