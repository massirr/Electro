import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuoteReference } from "@/lib/quoteReference";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: source, error: srcError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner", user.id)
    .single();

  if (srcError || !source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: items, error: itemsError } = await supabase
    .from("takeoff_items")
    .select("*")
    .eq("project_id", id);

  if (itemsError) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  // quote_reference has a partial unique index per owner (migration 004) — retry on collision,
  // same as POST /api/quotes.
  let copy: { id: string; name: string } | null = null;
  let copyError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const quoteReference = await generateQuoteReference(supabase, user.id);
    const result = await supabase
      .from("projects")
      .insert({
        name: `Copy of ${source.name}`,
        project_date: new Date().toISOString().slice(0, 10),
        job_type: source.job_type,
        hourly_rate: source.hourly_rate,
        margin_percent: source.margin_percent,
        grand_total: source.grand_total,
        owner: user.id,
        customer_name: "",
        customer_email: "",
        customer_address: "",
        quote_reference: quoteReference,
        validity_days: source.validity_days,
        delivery_date: null,
        customer_reference: "",
      })
      .select("id, name")
      .single();
    copy = result.data;
    copyError = result.error;
    if (!copyError || copyError.code !== "23505") break;
  }

  if (copyError || !copy) {
    console.error("[POST /api/quotes/[id]/duplicate] project insert", copyError);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (items && items.length > 0) {
    const { error: copyItemsError } = await supabase.from("takeoff_items").insert(
      items.map((i) => ({
        project_id: copy.id,
        external_item_id: i.external_item_id,
        name: i.name,
        quantity: i.quantity,
        hours_per_unit: i.hours_per_unit,
      }))
    );

    if (copyItemsError) {
      console.error("[POST /api/quotes/[id]/duplicate] items insert", copyItemsError);
      await supabase.from("projects").delete().eq("id", copy.id);
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
  }

  return NextResponse.json({ id: copy.id, name: copy.name }, { status: 201 });
}
