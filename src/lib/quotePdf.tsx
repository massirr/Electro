import type { SupabaseClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildQuote } from "@/domain/calculators";
import { loadCatalogAndKits } from "@/lib/catalog-seed";
import { QuotePdfDocument, DATE_LOCALE, type QuotePdfDocumentProps, type QuoteLanguage } from "@/components/quote/QuotePdfDocument";

export interface ProjectQuoteData {
  projectName: string;
  customerName: string;
  customerEmail: string;
  quoteReference: string;
  pdfProps: QuotePdfDocumentProps;
}

export async function loadProjectQuote(
  supabase: SupabaseClient,
  projectId: string,
  ownerId: string,
  language: QuoteLanguage = "nl"
): Promise<ProjectQuoteData | null> {
  // project/items/profile are independent reads — run concurrently instead of serially
  const [
    { data: project, error: projError },
    { data: items, error: itemsError },
    { data: profile },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).eq("owner", ownerId).single(),
    supabase.from("takeoff_items").select("*").eq("project_id", projectId),
    supabase.from("profiles").select("name, company_name, btw_number, company_address, company_phone, company_website").eq("id", ownerId).single(),
  ]);

  if (projError || !project || itemsError) return null;

  const { catalog, kits } = await loadCatalogAndKits(supabase, ownerId);

  const takeoffItems = (items ?? []).map((i) => ({
    id: i.external_item_id,
    name: i.name,
    quantity: i.quantity,
    hoursPerUnit: i.hours_per_unit,
  }));

  const quote = buildQuote(takeoffItems, kits, catalog, {
    hourlyRate: project.hourly_rate,
    jobType: project.job_type,
    marginPercent: project.margin_percent,
  });

  return {
    projectName: project.name,
    customerName: project.customer_name ?? "",
    customerEmail: project.customer_email ?? "",
    quoteReference: project.quote_reference ?? "",
    pdfProps: {
      company: {
        // Prefer the dedicated company name; fall back to the profile display name.
        name: profile?.company_name || profile?.name || "",
        address: profile?.company_address ?? "",
        phone: profile?.company_phone ?? "",
        website: profile?.company_website ?? "",
        btwNumber: profile?.btw_number ?? "",
      },
      customer: {
        name: project.customer_name ?? "",
        email: project.customer_email ?? "",
        address: project.customer_address ?? "",
      },
      meta: {
        date: new Date(project.project_date ?? project.created_at).toLocaleDateString(DATE_LOCALE[language]),
        reference: project.quote_reference ?? "",
        validityDays: project.validity_days ?? 30,
        deliveryDate: project.delivery_date ?? null,
        customerReference: project.customer_reference ?? "",
      },
      quote,
      language,
    },
  };
}

export async function renderQuotePdfBuffer(pdfProps: QuotePdfDocumentProps): Promise<Buffer> {
  return renderToBuffer(<QuotePdfDocument {...pdfProps} />);
}
