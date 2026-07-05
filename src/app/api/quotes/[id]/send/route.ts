import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { loadProjectQuote, renderQuotePdfBuffer } from "@/lib/quotePdf";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return NextResponse.json(
      { error: "Email sending isn't configured on this deployment. Download the PDF and send it yourself instead." },
      { status: 501 }
    );
  }

  const data = await loadProjectQuote(supabase, id, user.id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!data.customerEmail) {
    return NextResponse.json({ error: "This quote has no customer email on file" }, { status: 400 });
  }

  const buffer = await renderQuotePdfBuffer(data.pdfProps);
  const companyName = data.pdfProps.company.name || "Electro";
  const subject = `Offerte ${data.quoteReference || data.projectName}`.trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${companyName} <${fromEmail}>`,
    to: data.customerEmail,
    replyTo: user.email ?? undefined,
    subject,
    text: `Beste ${data.customerName || "klant"},\n\nIn bijlage vindt u de offerte${data.quoteReference ? ` ${data.quoteReference}` : ""}.\n\nMet vriendelijke groeten,\n${companyName}`,
    attachments: [{ filename: "offerte.pdf", content: buffer }],
  });

  if (error) {
    console.error("[POST /api/quotes/[id]/send]", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  await supabase.from("projects").update({ sent_at: new Date().toISOString() }).eq("id", id).eq("owner", user.id);

  return NextResponse.json({ sent: true });
}
