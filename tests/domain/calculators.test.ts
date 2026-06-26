import { describe, it, expect } from "vitest";
import {
  calcLaborTotal,
  expandKits,
  calcMaterialTotal,
  applyMargin,
  applyVAT,
  buildQuote,
  groupBySupplier,
} from "../../src/domain/calculators";
import type { TakeoffItem, Kit, Product, QuoteSettings } from "../../src/domain/types";

// Sample takeoff matches data/sample-inputs/sample-takeoff.json
const TAKEOFF: TakeoffItem[] = [
  { id: "recessed-6in",   name: 'Recessed light 6"',      quantity: 12,  hoursPerUnit: 0.5  },
  { id: "outlet-duplex",  name: "Duplex outlet",           quantity: 18,  hoursPerUnit: 0.25 },
  { id: "switch-single",  name: "Single pole switch",      quantity: 8,   hoursPerUnit: 0.25 },
  { id: "switch-3way",    name: "3-way switch",            quantity: 4,   hoursPerUnit: 0.35 },
  { id: "panel-200a",     name: "200A main panel",         quantity: 1,   hoursPerUnit: 4.0  },
  { id: "wire-12-2",      name: "12/2 NMD wire (meters)",  quantity: 150, hoursPerUnit: 0.02 },
  { id: "wire-14-2",      name: "14/2 NMD wire (meters)",  quantity: 200, hoursPerUnit: 0.02 },
];

const KITS: Kit[] = [
  {
    takeoffId: "recessed-6in",
    components: [
      { sku: "REC-600-WH", quantityPerUnit: 1 },
      { sku: "BOX-4SQ",    quantityPerUnit: 1 },
      { sku: "CON-WM-WH",  quantityPerUnit: 3 },
    ],
  },
  {
    takeoffId: "outlet-duplex",
    components: [
      { sku: "OUT-DUP-WH", quantityPerUnit: 1 },
      { sku: "BOX-1G",     quantityPerUnit: 1 },
      { sku: "CON-WM-WH",  quantityPerUnit: 2 },
    ],
  },
  {
    takeoffId: "switch-single",
    components: [
      { sku: "SW-SP-WH",  quantityPerUnit: 1 },
      { sku: "BOX-1G",    quantityPerUnit: 1 },
      { sku: "CON-WM-WH", quantityPerUnit: 2 },
    ],
  },
  {
    takeoffId: "switch-3way",
    components: [
      { sku: "SW-3W-WH",  quantityPerUnit: 1 },
      { sku: "BOX-1G",    quantityPerUnit: 1 },
      { sku: "CON-WM-WH", quantityPerUnit: 3 },
    ],
  },
  {
    takeoffId: "panel-200a",
    components: [
      { sku: "PNL-200A-MB", quantityPerUnit: 1 },
      { sku: "BRK-20A-SP",  quantityPerUnit: 4 },
      { sku: "BRK-15A-SP",  quantityPerUnit: 8 },
    ],
  },
  { takeoffId: "wire-12-2", components: [{ sku: "WIR-12-2-NMD", quantityPerUnit: 1 }] },
  { takeoffId: "wire-14-2", components: [{ sku: "WIR-14-2-NMD", quantityPerUnit: 1 }] },
];

const CATALOG: Map<string, Product> = new Map([
  ["REC-600-WH",   { sku: "REC-600-WH",   name: 'Recessed 6" LED White',      supplier: "CEBO",  price: 24.50,  category: "Lighting"    }],
  ["OUT-DUP-WH",   { sku: "OUT-DUP-WH",   name: "Duplex Outlet 15A White",     supplier: "Rexel", price: 3.20,   category: "Outlets"     }],
  ["SW-SP-WH",     { sku: "SW-SP-WH",     name: "Single Pole Switch White",    supplier: "Rexel", price: 2.80,   category: "Switches"    }],
  ["SW-3W-WH",     { sku: "SW-3W-WH",     name: "3-Way Switch White",          supplier: "Rexel", price: 4.50,   category: "Switches"    }],
  ["PNL-200A-MB",  { sku: "PNL-200A-MB",  name: "Main Panel 200A 40-slot",     supplier: "CEBO",  price: 385.00, category: "Panels"      }],
  ["WIR-12-2-NMD", { sku: "WIR-12-2-NMD", name: "12/2 NMD Wire per meter",    supplier: "CEBO",  price: 1.85,   category: "Wire"        }],
  ["WIR-14-2-NMD", { sku: "WIR-14-2-NMD", name: "14/2 NMD Wire per meter",    supplier: "CEBO",  price: 1.45,   category: "Wire"        }],
  ["BOX-4SQ",      { sku: "BOX-4SQ",      name: '4" Square Box',              supplier: "Rexel", price: 1.20,   category: "Boxes"       }],
  ["BOX-1G",       { sku: "BOX-1G",       name: "1-Gang Box",                  supplier: "Rexel", price: 0.95,   category: "Boxes"       }],
  ["CON-WM-WH",    { sku: "CON-WM-WH",    name: "Wire Connector (marettes) White", supplier: "Rexel", price: 0.15, category: "Connectors" }],
  ["BRK-20A-SP",   { sku: "BRK-20A-SP",   name: "20A Single Pole Breaker",     supplier: "CEBO",  price: 12.50,  category: "Breakers"    }],
  ["BRK-15A-SP",   { sku: "BRK-15A-SP",   name: "15A Single Pole Breaker",     supplier: "CEBO",  price: 11.00,  category: "Breakers"    }],
]);

const SETTINGS: QuoteSettings = { hourlyRate: 85, jobType: "new-build", marginPercent: 15 };

describe("calcLaborTotal", () => {
  it("sums hours across all takeoff items × hourly rate", () => {
    // 12×0.5 + 18×0.25 + 8×0.25 + 4×0.35 + 1×4.0 + 150×0.02 + 200×0.02 = 24.9 h × 85
    expect(calcLaborTotal(TAKEOFF, 85)).toBe(2116.50);
  });

  it("returns 0 for empty takeoff", () => {
    expect(calcLaborTotal([], 85)).toBe(0);
  });
});

describe("expandKits", () => {
  it("aggregates CON-WM-WH correctly across all fixtures", () => {
    // recessed: 12×3=36, outlet: 18×2=36, switch-single: 8×2=16, switch-3way: 4×3=12 → 100
    const lines = expandKits(TAKEOFF, KITS, CATALOG);
    const con = lines.find((l) => l.sku === "CON-WM-WH");
    expect(con?.quantity).toBe(100);
  });

  it("aggregates BOX-1G correctly", () => {
    // outlet: 18×1=18, switch-single: 8×1=8, switch-3way: 4×1=4 → 30
    const lines = expandKits(TAKEOFF, KITS, CATALOG);
    const box = lines.find((l) => l.sku === "BOX-1G");
    expect(box?.quantity).toBe(30);
  });

  it("expands wire SKUs 1:1 with takeoff quantity", () => {
    const lines = expandKits(TAKEOFF, KITS, CATALOG);
    expect(lines.find((l) => l.sku === "WIR-12-2-NMD")?.quantity).toBe(150);
    expect(lines.find((l) => l.sku === "WIR-14-2-NMD")?.quantity).toBe(200);
  });
});

describe("applyMargin / applyVAT", () => {
  it("margin is a % of subtotal", () => {
    expect(applyMargin(1000, 15)).toBe(150);
  });

  it("VAT applies to the amount passed in", () => {
    expect(applyVAT(1000, 21)).toBe(210);
  });
});

describe("groupBySupplier", () => {
  it("splits CEBO and Rexel correctly", () => {
    const lines = expandKits(TAKEOFF, KITS, CATALOG);
    const groups = groupBySupplier(lines);
    const suppliers = groups.map((g) => g.supplier).sort();
    expect(suppliers).toEqual(["CEBO", "Rexel"]);
  });

  it("CEBO group contains REC-600-WH, PNL-200A-MB, wire, breakers", () => {
    const lines = expandKits(TAKEOFF, KITS, CATALOG);
    const groups = groupBySupplier(lines);
    const cebo = groups.find((g) => g.supplier === "CEBO")!;
    const skus = cebo.lines.map((l) => l.sku).sort();
    expect(skus).toEqual(
      ["BRK-15A-SP", "BRK-20A-SP", "PNL-200A-MB", "REC-600-WH", "WIR-12-2-NMD", "WIR-14-2-NMD"]
    );
  });
});

describe("buildQuote", () => {
  it("produces correct laborTotal", () => {
    const q = buildQuote(TAKEOFF, KITS, CATALOG, SETTINGS);
    expect(q.laborTotal).toBe(2116.50);
  });

  it("applies margin then splits VAT by labor/material at new-build rates", () => {
    const q = buildQuote(TAKEOFF, KITS, CATALOG, SETTINGS);
    const expectedMargin = Math.round(q.subtotal * 0.15 * 100) / 100;
    expect(q.margin).toBe(expectedMargin);
    // labor VAT at 21%, materials VAT at 6%
    expect(q.laborVat).toBeGreaterThan(0);
    expect(q.materialVat).toBeGreaterThan(0);
  });

  it("grandTotal = subtotal + margin + laborVat + materialVat", () => {
    const q = buildQuote(TAKEOFF, KITS, CATALOG, SETTINGS);
    const expected = Math.round((q.subtotal + q.margin + q.laborVat + q.materialVat) * 100) / 100;
    expect(q.grandTotal).toBe(expected);
  });
});
