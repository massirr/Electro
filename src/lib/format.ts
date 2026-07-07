export function formatCurrency(n: number): string {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}
