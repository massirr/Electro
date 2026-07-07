import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { loadProjectQuote, renderQuotePdfBuffer } from "@/lib/quotePdf";
import type { QuoteLanguage } from "@/components/quote/QuotePdfDocument";

// Strips characters that would break or inject into the RFC 5322 From header's
// quoted-string display name (CR/LF header injection, unescaped quotes).
function sanitizeDisplayName(name: string) {
  return name.replace(/[\r\n"]/g, "");
}

function parseLang(v: string | null): QuoteLanguage {
  return v === "fr" || v === "en" || v === "nl" ? v : "nl";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const language = parseLang(req.nextUrl.searchParams.get("lang"));
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

  const data = await loadProjectQuote(supabase, id, user.id, language);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!data.customerEmail) {
    return NextResponse.json({ error: "This quote has no customer email on file" }, { status: 400 });
  }

  const buffer = await renderQuotePdfBuffer(data.pdfProps);
  const companyName = sanitizeDisplayName(data.pdfProps.company.name || "Electro");
  const subject = `Offerte ${data.quoteReference || data.projectName}`.trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `"${companyName}" <${fromEmail}>`,
    to: data.customerEmail,
    replyTo: user.email ?? undefined,
    subject,
    text: `Beste ${data.customerName || "klant"},\n\nIn bijlage vindt u de offerte${data.quoteReference ? ` ${data.quoteReference}` : ""}.\n\nMet vriendelijke groeten,\n${companyName}`,
    attachments: [{ filename: "offerte.pdf", content: buffer }],
  });

  if (error) {
    console.error("[POST /api/quotes/[id]/send]", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 502 });
  }

  await supabase.from("projects").update({ sent_at: new Date().toISOString() }).eq("id", id).eq("owner", user.id);

  return NextResponse.json({ sent: true });
}
