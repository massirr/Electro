import { NextRequest, NextResponse } from "next/server";
import type { TakeoffItem, QuoteSettings, Kit, Product } from "../../../domain/types";
import { buildQuote } from "../../../domain/calculators";
import { createClient } from "@/lib/supabase/server";
import { ensureCatalogSeeded } from "@/lib/catalog-seed";

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

  await ensureCatalogSeeded(supabase, user.id);

  const [{ data: products }, { data: kitRows }] = await Promise.all([
    supabase.from("catalog_products").select("sku, name, supplier, price, category").eq("owner", user.id),
    supabase.from("catalog_kits").select("slug, catalog_kit_components(sku, quantity_per_unit)").eq("owner", user.id),
  ]);

  const catalog = new Map<string, Product>(
    (products ?? []).map((p) => [p.sku, { sku: p.sku, name: p.name, supplier: p.supplier, price: p.price, category: p.category }])
  );

  const kits: Kit[] = (kitRows ?? []).map((k) => ({
    takeoffId: k.slug,
    components: ((k.catalog_kit_components as { sku: string; quantity_per_unit: number }[]) ?? []).map((c) => ({
      sku: c.sku,
      quantityPerUnit: c.quantity_per_unit,
    })),
  }));

  return NextResponse.json(buildQuote(takeoff, kits, catalog, settings));
}
