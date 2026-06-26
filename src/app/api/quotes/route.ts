import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/pb";
import type { JobType, TakeoffItem } from "@/domain/types";
import { buildQuote, expandKits, calcLaborTotal, calcMaterialTotal, applyMargin } from "@/domain/calculators";
import { resolve } from "path";
import { loadCatalog } from "@/io/load-catalog";
import { loadKits } from "@/io/load-kits";

const DATA = resolve(process.cwd(), "data/sample-inputs");

let _cache: Promise<[Awaited<ReturnType<typeof loadCatalog>>, Awaited<ReturnType<typeof loadKits>>]> | null = null;
function getDataCache() {
  if (!_cache) {
    _cache = Promise.all([
      loadCatalog(`${DATA}/sample-catalog.csv`),
      loadKits(`${DATA}/sample-kits.json`),
    ]).catch((e) => { _cache = null; throw e; });
  }
  return _cache;
}

export async function GET() {
  try {
    const records = await pb.collection("projects").getFullList({
      sort: "-created",
      fields: "id,name,projectDate,grandTotal,created",
    });
    return NextResponse.json(records);
  } catch (err) {
    console.error("[GET /api/quotes]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

interface SaveBody {
  name?: string;
  jobType?: JobType;
  hourlyRate?: number;
  marginPercent?: number;
  rows?: TakeoffItem[];
}

export async function POST(req: NextRequest) {
  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, jobType, hourlyRate, marginPercent, rows } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }
  if (!jobType || (jobType !== "renovation" && jobType !== "new-build")) {
    return NextResponse.json({ error: "jobType must be renovation or new-build" }, { status: 400 });
  }
  if (!hourlyRate || !marginPercent || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "hourlyRate, marginPercent, and rows are required" }, { status: 400 });
  }

  try {
    const [catalog, kits] = await getDataCache();
    const quote = buildQuote(rows, kits, catalog, { hourlyRate, jobType, marginPercent });

    const project = await pb.collection("projects").create({
      name: name.trim(),
      projectDate: new Date().toISOString().slice(0, 10),
      jobType,
      hourlyRate,
      marginPercent,
      grandTotal: quote.grandTotal,
    });

    await Promise.all(
      rows.map((row) =>
        pb.collection("takeoff_items").create({
          project: project.id,
          externalItemId: row.id,
          name: row.name,
          quantity: row.quantity,
          hoursPerUnit: row.hoursPerUnit,
        })
      )
    );

    return NextResponse.json({ id: project.id, name: project.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotes]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
