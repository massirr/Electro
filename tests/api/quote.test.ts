import { describe, it, expect } from "vitest";
import { POST } from "../../src/app/api/quote/route";
import type { TakeoffItem, QuoteSettings, QuoteResult } from "../../src/domain/types";

const TAKEOFF: TakeoffItem[] = [
  { id: "recessed-6in",  name: 'Recessed light 6"',      quantity: 12,  hoursPerUnit: 0.5  },
  { id: "outlet-duplex", name: "Duplex outlet",           quantity: 18,  hoursPerUnit: 0.25 },
  { id: "switch-single", name: "Single pole switch",      quantity: 8,   hoursPerUnit: 0.25 },
  { id: "switch-3way",   name: "3-way switch",            quantity: 4,   hoursPerUnit: 0.35 },
  { id: "panel-200a",    name: "200A main panel",         quantity: 1,   hoursPerUnit: 4.0  },
  { id: "wire-12-2",     name: "12/2 NMD wire (meters)",  quantity: 150, hoursPerUnit: 0.02 },
  { id: "wire-14-2",     name: "14/2 NMD wire (meters)",  quantity: 200, hoursPerUnit: 0.02 },
];

const SETTINGS: QuoteSettings = { hourlyRate: 85, vatPercent: 21, marginPercent: 15 };

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0];
}

describe("POST /api/quote", () => {
  it("returns 200 with correct laborTotal", async () => {
    const res = await POST(makeRequest({ takeoff: TAKEOFF, settings: SETTINGS }));
    expect(res.status).toBe(200);
    const data: QuoteResult = await res.json();
    expect(data.laborTotal).toBe(2116.50);
  });

  it("returns 200 with correct grandTotal", async () => {
    const res = await POST(makeRequest({ takeoff: TAKEOFF, settings: SETTINGS }));
    const data: QuoteResult = await res.json();
    expect(data.grandTotal).toBe(5088.58);
  });

  it("returns 200 with lineItems array", async () => {
    const res = await POST(makeRequest({ takeoff: TAKEOFF, settings: SETTINGS }));
    const data: QuoteResult = await res.json();
    expect(Array.isArray(data.lineItems)).toBe(true);
    expect(data.lineItems.length).toBeGreaterThan(0);
  });

  it("returns 400 for empty takeoff", async () => {
    const res = await POST(makeRequest({ takeoff: [], settings: SETTINGS }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing settings", async () => {
    const res = await POST(makeRequest({ takeoff: TAKEOFF }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    }) as Parameters<typeof POST>[0];
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
