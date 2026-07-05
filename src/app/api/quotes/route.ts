import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { JobType, TakeoffItem } from "@/domain/types";
import { buildQuote } from "@/domain/calculators";
import { loadCatalogAndKits } from "@/lib/catalog-seed";
import { generateQuoteReference } from "@/lib/quoteReference";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, project_date, grand_total, created_at, sent_at")
    .eq("owner", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/quotes]", error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  return NextResponse.json(data.map(r => ({
    id: r.id,
    name: r.name,
    projectDate: r.project_date,
    grandTotal: r.grand_total,
    created: r.created_at,
    sentAt: r.sent_at,
  })));
}

interface SaveBody {
  name?: string;
  jobType?: JobType;
  hourlyRate?: number;
  marginPercent?: number;
  rows?: TakeoffItem[];
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  validityDays?: number;
  deliveryDate?: string | null;
  customerReference?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: SaveBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const {
    name, jobType, hourlyRate, marginPercent, rows,
    customerName, customerEmail, customerAddress,
    validityDays, deliveryDate, customerReference,
  } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  if (!jobType || (jobType !== "renovation" && jobType !== "new-build"))
    return NextResponse.json({ error: "jobType must be renovation or new-build" }, { status: 400 });
  if (!hourlyRate || !marginPercent || !Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "hourlyRate, marginPercent, and rows are required" }, { status: 400 });

  try {
    const { catalog, kits } = await loadCatalogAndKits(supabase, user.id);
    const quote = buildQuote(rows, kits, catalog, { hourlyRate, jobType, marginPercent });

    // quote_reference has a partial unique index per owner (migration 004) — on the rare
    // collision (concurrent saves racing on the same COUNT), regenerate and retry rather
    // than silently issuing two quotes with the same reference number.
    let project: { id: string; name: string } | null = null;
    let projError: { code?: string; message?: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const quoteReference = await generateQuoteReference(supabase, user.id);
      const result = await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          project_date: new Date().toISOString().slice(0, 10),
          job_type: jobType,
          hourly_rate: hourlyRate,
          margin_percent: marginPercent,
          grand_total: quote.grandTotal,
          owner: user.id,
          customer_name: customerName ?? "",
          customer_email: customerEmail ?? "",
          customer_address: customerAddress ?? "",
          quote_reference: quoteReference,
          validity_days: validityDays ?? 30,
          delivery_date: deliveryDate ?? null,
          customer_reference: customerReference ?? "",
        })
        .select("id, name")
        .single();
      project = result.data;
      projError = result.error;
      if (!projError || projError.code !== "23505") break;
    }

    if (projError || !project) {
      console.error("[POST /api/quotes] project insert", projError);
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { error: itemsError } = await supabase.from("takeoff_items").insert(
      rows.map(row => ({
        project_id: project.id,
        external_item_id: row.id,
        name: row.name,
        quantity: row.quantity,
        hours_per_unit: row.hoursPerUnit,
      }))
    );

    if (itemsError) {
      console.error("[POST /api/quotes] items insert", itemsError);
      await supabase.from("projects").delete().eq("id", project.id);
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    return NextResponse.json({ id: project.id, name: project.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotes]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
