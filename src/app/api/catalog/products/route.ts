import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureCatalogSeeded } from "@/lib/catalog-seed";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureCatalogSeeded(supabase, user.id);

  const { data, error } = await supabase
    .from("catalog_products")
    .select("id, sku, name, supplier, price, category")
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
  const { sku, name, supplier, price, category } = body;
  if (!sku || !name) return NextResponse.json({ error: "sku and name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("catalog_products")
    .insert({ owner: user.id, sku, name, supplier: supplier ?? "", price: price ?? 0, category: category ?? "" })
    .select("id, sku, name, supplier, price, category")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json(data, { status: 201 });
}
