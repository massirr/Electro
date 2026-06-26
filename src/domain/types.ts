export interface TakeoffItem {
  id: string;
  name: string;
  quantity: number;
  hoursPerUnit: number;
}

export interface Product {
  sku: string;
  name: string;
  supplier: string;
  price: number;
  category: string;
}

export interface KitComponent {
  sku: string;
  quantityPerUnit: number;
}

export interface Kit {
  takeoffId: string;
  components: KitComponent[];
}

export interface LineItem {
  sku: string;
  name: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type JobType = "renovation" | "new-build";

export interface QuoteResult {
  jobType: JobType;
  laborTotal: number;
  materialTotal: number;
  subtotal: number;
  margin: number;
  laborVat: number;
  materialVat: number;
  grandTotal: number;
  lineItems: LineItem[];
}

export interface SupplierGroup {
  supplier: string;
  lines: LineItem[];
}

export interface QuoteSettings {
  hourlyRate: number;
  jobType: JobType;
  marginPercent: number;
}
