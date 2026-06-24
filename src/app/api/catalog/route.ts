import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "path";

export interface CatalogItem {
  id: string;
  name: string;
  defaultHu: number;
}

interface KitRaw {
  takeoff_id: string;
  takeoff_name: string;
  default_hours_per_unit: number;
}

interface KitsJSON {
  kits: KitRaw[];
}

let _catalog: Promise<CatalogItem[]> | null = null;
function getCatalog(): Promise<CatalogItem[]> {
  if (!_catalog) {
    const path = resolve(process.cwd(), "data/sample-inputs/sample-kits.json");
    _catalog = readFile(path, "utf-8")
      .then((text) => {
        const raw: KitsJSON = JSON.parse(text);
        return raw.kits.map((k) => ({
          id: k.takeoff_id,
          name: k.takeoff_name,
          defaultHu: k.default_hours_per_unit,
        }));
      })
      .catch((e) => {
        _catalog = null; // allow retry on next request
        throw e;
      });
  }
  return _catalog;
}

export async function GET() {
  const items = await getCatalog();
  return NextResponse.json(items);
}
