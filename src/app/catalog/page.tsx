import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "@/components/catalog/ProductsTable";
import { KitsTable } from "@/components/catalog/KitsTable";
import { CsvImporter } from "@/components/catalog/CsvImporter";

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: products }, { data: kits }] = await Promise.all([
    supabase.from("catalog_products").select("id, sku, name, supplier, price, category").eq("owner", user.id).order("name"),
    supabase.from("catalog_kits").select("id, slug, name, default_hu, catalog_kit_components(id, sku, quantity_per_unit)").eq("owner", user.id).order("name"),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-8 pl-4" style={{ borderLeft: "2px solid var(--accent)" }}>
        <h1 className="font-semibold text-[var(--ink)]" style={{ fontSize: "clamp(20px, 5vw, 28px)", letterSpacing: "-0.6px" }}>
          Catalog
        </h1>
        <p className="text-sm text-[var(--ink-muted)] mt-1">Manage your products and kit assemblies</p>
      </header>

      <div className="space-y-10">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-muted)]">Products</h2>
            <CsvImporter />
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", boxShadow: "var(--card-shadow)" }}>
            <ProductsTable initial={products ?? []} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-muted)] mb-4">Kits</h2>
          <div className="rounded-lg p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", boxShadow: "var(--card-shadow)" }}>
            <KitsTable initial={kits ?? []} />
          </div>
        </section>
      </div>
    </main>
  );
}
