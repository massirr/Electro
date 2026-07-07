import { NextRequest, NextResponse } from "next/server";
import type { TakeoffItem, QuoteSettings } from "../../../domain/types";
import { buildQuote } from "../../../domain/calculators";
import { createClient } from "@/lib/supabase/server";
import { loadCatalogAndKits } from "@/lib/catalog-seed";

export async function POST(req: NextRequest) {
  let body: { takeoff?: TakeoffItem[]; settings?: QuoteSettings };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { takeoff, settings } = body;

  if (!Array.isArray(takeoff) || takeoff.length === 0) {
    return NextResponse.json({ error: "takeoff must be a non-empty array" }, { status: 400 });
  }
  if (!settings?.hourlyRate || !settings?.jobType || !settings?.marginPercent) {
    return NextResponse.json({ error: "settings must include hourlyRate, jobType, marginPercent" }, { status: 400 });
  }
  if (settings.jobType !== "renovation" && settings.jobType !== "new-build") {
    return NextResponse.json({ error: "jobType must be 'renovation' or 'new-build'" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { catalog, kits } = await loadCatalogAndKits(supabase, user.id);

  return NextResponse.json(buildQuote(takeoff, kits, catalog, settings));
}
