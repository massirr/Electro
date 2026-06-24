import type { Kit } from "../domain/types";

interface KitsJSON {
  kits: Array<{
    takeoff_id: string;
    takeoff_name: string;
    components: Array<{
      sku: string;
      quantity_per_unit: number;
    }>;
  }>;
}

export async function loadKits(filePath: string): Promise<Kit[]> {
  const text = await Bun.file(filePath).text();
  const raw: KitsJSON = JSON.parse(text);

  return raw.kits.map((k) => ({
    takeoffId: k.takeoff_id,
    components: k.components.map((c) => ({
      sku: c.sku,
      quantityPerUnit: c.quantity_per_unit,
    })),
  }));
}
