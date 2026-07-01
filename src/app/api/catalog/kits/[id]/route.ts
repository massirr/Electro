import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { error: kitError } = await supabase
    .from("catalog_kits")
    .update({ slug, name, default_hu })
    .eq("id", id)
    .eq("owner", user.id);

  if (kitError) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Replace components: delete all then re-insert
  await supabase.from("catalog_kit_components").delete().eq("kit_id", id);
  if (components?.length > 0) {
    await supabase.from("catalog_kit_components").insert(
      components.map((c) => ({ kit_id: id, sku: c.sku, quantity_per_unit: c.quantity_per_unit }))
    );
  }

  const { data } = await supabase
    .from("catalog_kits")
    .select("id, slug, name, default_hu, catalog_kit_components(id, sku, quantity_per_unit)")
    .eq("id", id)
    .single();

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Components cascade-delete via FK
  const { error } = await supabase.from("catalog_kits").delete().eq("id", id).eq("owner", user.id);
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
