import { readFile } from "node:fs/promises";
import type { TakeoffItem, QuoteSettings } from "../domain/types";

interface TakeoffJSON {
  project: string;
  date: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    hours_per_unit: number;
  }>;
  settings: {
    hourly_rate: number;
    vat_percent: number;
    margin_percent: number;
  };
}

export interface TakeoffData {
  project: string;
  date: string;
  items: TakeoffItem[];
  settings: QuoteSettings;
}

export async function loadTakeoff(filePath: string): Promise<TakeoffData> {
  const text = await readFile(filePath, "utf-8");
  const raw: TakeoffJSON = JSON.parse(text);

  const items: TakeoffItem[] = raw.items.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    hoursPerUnit: i.hours_per_unit,
  }));

  const settings: QuoteSettings = {
    hourlyRate: raw.settings.hourly_rate,
    vatPercent: raw.settings.vat_percent,
    marginPercent: raw.settings.margin_percent,
  };

  return { project: raw.project, date: raw.date, items, settings };
}
