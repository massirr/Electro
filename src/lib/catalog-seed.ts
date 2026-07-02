import type { SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "path";

const DATA = resolve(process.cwd(), "data/sample-inputs");

// Avoids a DB round-trip on every warm request — resets only on cold start
const seededUsers = new Set<string>();

export async function ensureCatalogSeeded(supabase: SupabaseClient, userId: string) {
  if (seededUsers.has(userId)) return;

  const { count } = await supabase
    .from("catalog_products")
    .select("id", { count: "exact", head: true })
    .eq("owner", userId);

  if (count && count > 0) { seededUsers.add(userId); return; }

  const [csvText, jsonText] = await Promise.all([
    readFile(`${DATA}/sample-catalog.csv`, "utf-8"),
    readFile(`${DATA}/sample-kits.json`, "utf-8"),
  ]);

  const products = csvText
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [sku, name, supplier, price, category] = line.split(",");
      return { owner: userId, sku: sku.trim(), name: name.trim(), supplier: supplier.trim(), price: parseFloat(price), category: category.trim() };
    });

  await supabase.from("catalog_products").insert(products);

  const { kits } = JSON.parse(jsonText) as {
    kits: Array<{
      takeoff_id: string;
      takeoff_name: string;
      default_hours_per_unit: number;
      components: Array<{ sku: string; quantity_per_unit: number }>;
    }>;
  };

  for (const kit of kits) {
    const { data: kitRow } = await supabase
      .from("catalog_kits")
      .insert({ owner: userId, slug: kit.takeoff_id, name: kit.takeoff_name, default_hu: kit.default_hours_per_unit })
      .select("id")
      .single();

    if (kitRow && kit.components?.length > 0) {
      await supabase.from("catalog_kit_components").insert(
        kit.components.map((c) => ({ kit_id: kitRow.id, sku: c.sku, quantity_per_unit: c.quantity_per_unit }))
      );
    }
  }
  seededUsers.add(userId);
}
