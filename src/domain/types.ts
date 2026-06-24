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

export interface QuoteResult {
  laborTotal: number;
  materialTotal: number;
  subtotal: number;
  margin: number;
  vat: number;
  grandTotal: number;
  lineItems: LineItem[];
}

export interface SupplierGroup {
  supplier: string;
  lines: LineItem[];
}

export interface QuoteSettings {
  hourlyRate: number;
  vatPercent: number;
  marginPercent: number;
}
