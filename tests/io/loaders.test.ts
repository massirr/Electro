import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { loadTakeoff } from "../../src/io/load-takeoff";
import { loadCatalog } from "../../src/io/load-catalog";
import { loadKits } from "../../src/io/load-kits";
import { exportQuoteCsv, exportSupplierCsv } from "../../src/io/export-csv";
import type { QuoteResult, SupplierGroup } from "../../src/domain/types";

const SAMPLE_DIR = resolve(import.meta.dirname, "../../data/sample-inputs");

describe("loadTakeoff", () => {
  it("returns 7 items", async () => {
    const { items } = await loadTakeoff(`${SAMPLE_DIR}/sample-takeoff.json`);
    expect(items).toHaveLength(7);
  });

  it("converts snake_case to camelCase", async () => {
    const { items } = await loadTakeoff(`${SAMPLE_DIR}/sample-takeoff.json`);
    const panel = items.find((i) => i.id === "panel-200a")!;
    expect(panel.hoursPerUnit).toBe(4.0);
    expect(panel.quantity).toBe(1);
  });

  it("parses settings correctly", async () => {
    const { settings } = await loadTakeoff(`${SAMPLE_DIR}/sample-takeoff.json`);
    expect(settings.hourlyRate).toBe(85);
    expect(settings.jobType).toBe("new-build");
    expect(settings.marginPercent).toBe(15);
  });
});

describe("loadCatalog", () => {
  it("returns 12 products", async () => {
    const catalog = await loadCatalog(`${SAMPLE_DIR}/sample-catalog.csv`);
    expect(catalog.size).toBe(12);
  });

  it("parses REC-600-WH correctly", async () => {
    const catalog = await loadCatalog(`${SAMPLE_DIR}/sample-catalog.csv`);
    const product = catalog.get("REC-600-WH")!;
    expect(product.supplier).toBe("CEBO");
    expect(product.price).toBe(24.50);
    expect(product.category).toBe("Lighting");
  });

  it("parses CON-WM-WH with correct price", async () => {
    const catalog = await loadCatalog(`${SAMPLE_DIR}/sample-catalog.csv`);
    expect(catalog.get("CON-WM-WH")!.price).toBe(0.15);
  });
});

describe("loadKits", () => {
  it("returns 7 kits", async () => {
    const kits = await loadKits(`${SAMPLE_DIR}/sample-kits.json`);
    expect(kits).toHaveLength(7);
  });

  it("converts takeoff_id and quantity_per_unit to camelCase", async () => {
    const kits = await loadKits(`${SAMPLE_DIR}/sample-kits.json`);
    const recessed = kits.find((k) => k.takeoffId === "recessed-6in")!;
    expect(recessed.components).toHaveLength(3);
    expect(recessed.components[0].quantityPerUnit).toBe(1);
    expect(recessed.components[2].quantityPerUnit).toBe(3);
  });
});

describe("exportQuoteCsv", () => {
  it("produces header + rows with correct column count", () => {
    const quote: QuoteResult = {
      jobType: "new-build",
      laborTotal: 100,
      materialTotal: 50,
      subtotal: 150,
      margin: 22.5,
      laborVat: 34.73,
      materialVat: 4.19,
      grandTotal: 211.42,
      lineItems: [
        { sku: "REC-600-WH", name: 'Recessed 6" LED', supplier: "CEBO", quantity: 12, unitPrice: 24.50, totalPrice: 294 },
      ],
    };
    const csv = exportQuoteCsv(quote);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("sku");
    expect(lines[0].split(",")).toHaveLength(6);
    expect(lines[1]).toContain("REC-600-WH");
  });
});

describe("exportSupplierCsv", () => {
  it("produces header + rows for a single supplier", () => {
    const group: SupplierGroup = {
      supplier: "CEBO",
      lines: [
        { sku: "REC-600-WH", name: 'Recessed 6" LED', supplier: "CEBO", quantity: 12, unitPrice: 24.50, totalPrice: 294 },
      ],
    };
    const csv = exportSupplierCsv(group);
    const lines = csv.split("\n");
    expect(lines[0].split(",")).toHaveLength(5);
    expect(lines[1]).toContain("REC-600-WH");
  });
});
