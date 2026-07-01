import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureCatalogSeeded } from "@/lib/catalog-seed";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureCatalogSeeded(supabase, user.id);

  const { data: kits } = await supabase
    .from("catalog_kits")
    .select("slug, name, default_hu")
    .eq("owner", user.id)
    .order("name");

  return NextResponse.json(
    (kits ?? []).map((k) => ({ id: k.slug, name: k.name, defaultHu: k.default_hu }))
  );
}
