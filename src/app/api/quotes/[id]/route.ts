import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner", user.id)
    .single();

  if (projError || !project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: items, error: itemsError } = await supabase
    .from("takeoff_items")
    .select("*")
    .eq("project_id", id);

  if (itemsError) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      projectDate: project.project_date,
      jobType: project.job_type,
      hourlyRate: project.hourly_rate,
      marginPercent: project.margin_percent,
      grandTotal: project.grand_total,
      customerName: project.customer_name,
      customerEmail: project.customer_email,
      customerAddress: project.customer_address,
      validityDays: project.validity_days,
      deliveryDate: project.delivery_date,
      customerReference: project.customer_reference,
      quoteReference: project.quote_reference,
      sentAt: project.sent_at,
      owner: project.owner,
      created: project.created_at,
    },
    items: items.map(i => ({
      id: i.external_item_id,
      name: i.name,
      quantity: i.quantity,
      hoursPerUnit: i.hours_per_unit,
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS ensures user can only delete their own projects; cascade removes takeoff_items
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("owner", user.id);
  if (error) return NextResponse.json({ error: "Not found or service unavailable" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
