import { resolve } from "path";
import { loadCatalog } from "@/io/load-catalog";
import { loadKits } from "@/io/load-kits";
import { buildQuote } from "@/domain/calculators";
import { QuotePreview } from "@/components/quote/QuotePreview";
import type { TakeoffItem, QuoteSettings } from "@/domain/types";

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

export default async function QuotePage() {
  const DATA = resolve(process.cwd(), "data/sample-inputs");
  const catalog = await loadCatalog(`${DATA}/sample-catalog.csv`);
  const kits = await loadKits(`${DATA}/sample-kits.json`);
  const quote = buildQuote(TAKEOFF, kits, catalog, SETTINGS);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-1">
          Electro
        </p>
        <h1 className="text-xl font-semibold">Residential Apartment — Unit 4B</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10">
        {/* Takeoff */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">
            Takeoff
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 text-left font-medium text-[var(--muted)]">Item</th>
                <th className="py-2 text-right font-medium text-[var(--muted)]">Qty</th>
                <th className="py-2 text-right font-medium text-[var(--muted)]">h/u</th>
              </tr>
            </thead>
            <tbody>
              {TAKEOFF.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)]">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--muted)]">{item.hoursPerUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Quote */}
        <QuotePreview quote={quote} />
      </div>
    </main>
  );
}
