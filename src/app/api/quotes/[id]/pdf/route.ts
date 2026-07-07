import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadProjectQuote, renderQuotePdfBuffer } from "@/lib/quotePdf";
import type { QuoteLanguage } from "@/components/quote/QuotePdfDocument";

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "quote";
}

function parseLang(v: string | null): QuoteLanguage {
  return v === "fr" || v === "en" || v === "nl" ? v : "nl";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const language = parseLang(req.nextUrl.searchParams.get("lang"));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await loadProjectQuote(supabase, id, user.id, language);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderQuotePdfBuffer(data.pdfProps);
  const filename = `${slugify(data.quoteReference || data.projectName)}.pdf`;

  return new NextResponse(new Blob([Uint8Array.from(buffer)], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
