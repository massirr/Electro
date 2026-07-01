import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureCatalogSeeded } from "@/lib/catalog-seed";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureCatalogSeeded(supabase, user.id);

  const { data, error } = await supabase
    .from("catalog_kits")
    .select("id, slug, name, default_hu, catalog_kit_components(id, sku, quantity_per_unit)")
    .eq("owner", user.id)
    .order("name");

  if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, name, default_hu, components } = body as {
    slug: string;
    name: string;
    default_hu: number;
    components: Array<{ sku: string; quantity_per_unit: number }>;
  };

  if (!slug || !name) return NextResponse.json({ error: "slug and name required" }, { status: 400 });

  const { data: kit, error: kitError } = await supabase
    .from("catalog_kits")
    .insert({ owner: user.id, slug, name, default_hu: default_hu ?? 0 })
    .select("id, slug, name, default_hu")
    .single();

  if (kitError || !kit) return NextResponse.json({ error: kitError?.message ?? "Failed" }, { status: 409 });

  if (components?.length > 0) {
    await supabase.from("catalog_kit_components").insert(
      components.map((c) => ({ kit_id: kit.id, sku: c.sku, quantity_per_unit: c.quantity_per_unit }))
    );
  }

  const { data: full } = await supabase
    .from("catalog_kits")
    .select("id, slug, name, default_hu, catalog_kit_components(id, sku, quantity_per_unit)")
    .eq("id", kit.id)
    .single();

  return NextResponse.json(full, { status: 201 });
}
