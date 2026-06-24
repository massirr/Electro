import { resolve } from "path";
import { loadCatalog } from "../io/load-catalog";
import { loadKits } from "../io/load-kits";
import { buildQuote, groupBySupplier } from "../domain/calculators";
import type { TakeoffItem, QuoteSettings } from "../domain/types";

const TAKEOFF: TakeoffItem[] = [
  { id: "recessed-6in",  name: 'Recessed light 6"',      quantity: 12,  hoursPerUnit: 0.5  },
  { id: "outlet-duplex", name: "Duplex outlet",           quantity: 18,  hoursPerUnit: 0.25 },
  { id: "switch-single", name: "Single pole switch",      quantity: 8,   hoursPerUnit: 0.25 },
  { id: "switch-3way",   name: "3-way switch",            quantity: 4,   hoursPerUnit: 0.35 },
  { id: "panel-200a",    name: "200A main panel",         quantity: 1,   hoursPerUnit: 4.0  },
  { id: "wire-12-2",     name: "12/2 NMD wire (m)",       quantity: 150, hoursPerUnit: 0.02 },
  { id: "wire-14-2",     name: "14/2 NMD wire (m)",       quantity: 200, hoursPerUnit: 0.02 },
];

const SETTINGS: QuoteSettings = { hourlyRate: 85, vatPercent: 21, marginPercent: 15 };

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function QuotePage() {
  const DATA = resolve(process.cwd(), "data/sample-inputs");
  const catalog = await loadCatalog(`${DATA}/sample-catalog.csv`);
  const kits = await loadKits(`${DATA}/sample-kits.json`);
  const quote = buildQuote(TAKEOFF, kits, catalog, SETTINGS);
  const groups = groupBySupplier(quote.lineItems);

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "2rem", color: "var(--foreground)" }}>
        Electro — Residential Apartment Unit 4B
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Left panel: takeoff */}
        <section>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            Takeoff Items
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "var(--muted)", fontWeight: 500 }}>Item</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0", color: "var(--muted)", fontWeight: 500 }}>Qty</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0", color: "var(--muted)", fontWeight: 500 }}>h/unit</th>
              </tr>
            </thead>
            <tbody>
              {TAKEOFF.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.5rem 0" }}>{item.name}</td>
                  <td style={{ padding: "0.5rem 0", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "0.5rem 0", textAlign: "right", color: "var(--muted)" }}>{item.hoursPerUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Right panel: quote result */}
        <section>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            Quote Summary
          </h2>

          <div style={{ background: "var(--surface)", borderRadius: "0.5rem", padding: "1.25rem", marginBottom: "1rem" }}>
            {[
              ["Labor", fmt(quote.laborTotal)],
              ["Materials", fmt(quote.materialTotal)],
              ["Subtotal", fmt(quote.subtotal)],
              ["Margin 15%", fmt(quote.margin)],
              ["VAT 21%", fmt(quote.vat)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", fontSize: "0.875rem", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted)" }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0 0", fontSize: "1rem", fontWeight: 700 }}>
              <span>Grand Total</span>
              <span style={{ color: "var(--accent)" }}>{fmt(quote.grandTotal)}</span>
            </div>
          </div>

          <h2 style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            By Supplier
          </h2>
          {groups.map((g) => (
            <div key={g.supplier} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", fontSize: "0.875rem" }}>
              <span>{g.supplier}</span>
              <span>{fmt(g.lines.reduce((s, l) => s + l.totalPrice, 0))}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
