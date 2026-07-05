import type { SupabaseClient } from "@supabase/supabase-js";

export async function generateQuoteReference(supabase: SupabaseClient, ownerId: string) {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("owner", ownerId)
    .gte("project_date", `${year}-01-01`)
    .lte("project_date", `${year}-12-31`);
  return `Q-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}
