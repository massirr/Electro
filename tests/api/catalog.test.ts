import { describe, it, expect } from "vitest";
import { GET } from "../../src/app/api/catalog/route";
import type { CatalogItem } from "../../src/app/api/catalog/route";

describe("GET /api/catalog", () => {
  it("returns 200 with an array", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data: CatalogItem[] = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns exactly 7 items", async () => {
    const res = await GET();
    const data: CatalogItem[] = await res.json();
    expect(data).toHaveLength(7);
  });

  it("each item has id, name, defaultHu fields", async () => {
    const res = await GET();
    const data: CatalogItem[] = await res.json();
    for (const item of data) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.name).toBe("string");
      expect(typeof item.defaultHu).toBe("number");
      expect(item.defaultHu).toBeGreaterThan(0);
    }
  });

  it("outlet-duplex has defaultHu 0.25", async () => {
    const res = await GET();
    const data: CatalogItem[] = await res.json();
    const duplex = data.find((i) => i.id === "outlet-duplex");
    expect(duplex).toBeDefined();
    expect(duplex?.defaultHu).toBe(0.25);
    expect(duplex?.name).toBe("Duplex outlet");
  });

  it("panel-200a has defaultHu 4.0", async () => {
    const res = await GET();
    const data: CatalogItem[] = await res.json();
    const panel = data.find((i) => i.id === "panel-200a");
    expect(panel).toBeDefined();
    expect(panel?.defaultHu).toBe(4.0);
  });
});
