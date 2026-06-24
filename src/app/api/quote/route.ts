import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import type { TakeoffItem, QuoteSettings } from "../../../domain/types";
import { buildQuote } from "../../../domain/calculators";
import { loadCatalog } from "../../../io/load-catalog";
import { loadKits } from "../../../io/load-kits";

const DATA = resolve(process.cwd(), "data/sample-inputs");

let _cache: Promise<[Awaited<ReturnType<typeof loadCatalog>>, Awaited<ReturnType<typeof loadKits>>]> | null = null;
function getDataCache() {
  if (!_cache) {
    _cache = Promise.all([
      loadCatalog(`${DATA}/sample-catalog.csv`),
      loadKits(`${DATA}/sample-kits.json`),
    ]).catch((e) => {
      _cache = null; // allow retry on next request
      throw e;
    });
  }
  return _cache;
}

export async function POST(req: NextRequest) {
  let body: { takeoff?: TakeoffItem[]; settings?: QuoteSettings };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { takeoff, settings } = body;

  if (!Array.isArray(takeoff) || takeoff.length === 0) {
    return NextResponse.json(
      { error: "takeoff must be a non-empty array" },
      { status: 400 }
    );
  }

  if (!settings?.hourlyRate || !settings?.vatPercent || !settings?.marginPercent) {
    return NextResponse.json(
      { error: "settings must include hourlyRate, vatPercent, marginPercent" },
      { status: 400 }
    );
  }

  const [catalog, kits] = await getDataCache();

  const quote = buildQuote(takeoff, kits, catalog, settings);
  return NextResponse.json(quote);
}
