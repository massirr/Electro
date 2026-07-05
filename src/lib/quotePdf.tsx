import type { SupabaseClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildQuote } from "@/domain/calculators";
import type { Kit, Product } from "@/domain/types";
import { ensureCatalogSeeded } from "@/lib/catalog-seed";
import { QuotePdfDocument, type QuotePdfDocumentProps } from "@/components/quote/QuotePdfDocument";

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
  ownerId: string
): Promise<ProjectQuoteData | null> {
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner", ownerId)
    .single();

  if (projError || !project) return null;

  const { data: items, error: itemsError } = await supabase
    .from("takeoff_items")
    .select("*")
    .eq("project_id", projectId);

  if (itemsError) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, btw_number, company_address, company_phone, company_website")
    .eq("id", ownerId)
    .single();

  await ensureCatalogSeeded(supabase, ownerId);

  const [{ data: products }, { data: kitRows }] = await Promise.all([
    supabase.from("catalog_products").select("sku, name, supplier, price, category").eq("owner", ownerId),
    supabase.from("catalog_kits").select("slug, catalog_kit_components(sku, quantity_per_unit)").eq("owner", ownerId),
  ]);

  const catalog = new Map<string, Product>(
    (products ?? []).map((p) => [p.sku, { sku: p.sku, name: p.name, supplier: p.supplier, price: p.price, category: p.category }])
  );

  const kits: Kit[] = (kitRows ?? []).map((k) => ({
    takeoffId: k.slug,
    components: ((k.catalog_kit_components as { sku: string; quantity_per_unit: number }[]) ?? []).map((c) => ({
      sku: c.sku,
      quantityPerUnit: c.quantity_per_unit,
    })),
  }));

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
        name: profile?.name ?? "",
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
        date: new Date(project.project_date ?? project.created_at).toLocaleDateString("fr-BE"),
        reference: project.quote_reference ?? "",
        validityDays: project.validity_days ?? 30,
        deliveryDate: project.delivery_date ?? null,
        customerReference: project.customer_reference ?? "",
      },
      quote,
    },
  };
}

export async function renderQuotePdfBuffer(pdfProps: QuotePdfDocumentProps): Promise<Buffer> {
  return renderToBuffer(<QuotePdfDocument {...pdfProps} />);
}
