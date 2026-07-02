import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ImportRow {
  sku: string;
  name: string;
  supplier?: string;
  price?: number;
  category?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows }: { rows: ImportRow[] } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  const records = rows
    .filter(r => r.sku?.trim() && r.name?.trim())
    .map(r => ({
      owner: user.id,
      sku: r.sku.trim(),
      name: r.name.trim(),
      supplier: r.supplier?.trim() ?? "",
      price: Math.max(0, Number(r.price) || 0),
      category: r.category?.trim() ?? "",
    }));

  if (records.length === 0)
    return NextResponse.json({ error: "No valid rows (sku and name required)" }, { status: 400 });

  const { error } = await supabase
    .from("catalog_products")
    .upsert(records, { onConflict: "owner,sku" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: records.length });
}
