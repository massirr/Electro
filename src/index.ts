import { resolve } from "path";
import { loadTakeoff } from "./io/load-takeoff";
import { loadCatalog } from "./io/load-catalog";
import { loadKits } from "./io/load-kits";
import { buildQuote, groupBySupplier } from "./domain/calculators";

const DATA = resolve(import.meta.dirname, "../data/sample-inputs");

const { items, settings, project } = await loadTakeoff(`${DATA}/sample-takeoff.json`);
const catalog = await loadCatalog(`${DATA}/sample-catalog.csv`);
const kits = await loadKits(`${DATA}/sample-kits.json`);

const quote = buildQuote(items, kits, catalog, settings);
const groups = groupBySupplier(quote.lineItems);

console.log(`\n=== Electro Quote — ${project} ===\n`);
console.log(`Labor:     $${quote.laborTotal.toFixed(2)}`);
console.log(`Materials: $${quote.materialTotal.toFixed(2)}`);
console.log(`Subtotal:  $${quote.subtotal.toFixed(2)}`);
console.log(`Margin 15%: $${quote.margin.toFixed(2)}`);
console.log(`VAT 21%:   $${quote.vat.toFixed(2)}`);
console.log(`GRAND TOTAL: $${quote.grandTotal.toFixed(2)}`);

console.log(`\n--- Supplier Breakdown ---`);
for (const g of groups) {
  const total = g.lines.reduce((s, l) => s + l.totalPrice, 0);
  console.log(`${g.supplier}: $${total.toFixed(2)} (${g.lines.length} SKUs)`);
}
