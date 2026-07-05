import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { QuoteResult } from "@/domain/types";
import { sortLineItems, buildQuoteSummaryRows } from "@/domain/calculators";
import { formatCurrency } from "@/lib/format";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-BE");
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  border: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#5E6AD2",
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 10 },
  companyBlock: { maxWidth: 280, marginBottom: 20 },
  companyName: { fontSize: 12, fontWeight: 700, marginBottom: 3 },
  muted: { color: "#555" },
  mutedLine: { color: "#555", marginBottom: 2 },
  sectionLabel: {
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 5,
  },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  col: { width: "48%" },
  bold: { fontWeight: 700, marginBottom: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  section: { marginBottom: 18 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#ccc",
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomStyle: "solid",
    borderBottomColor: "#eee",
    paddingVertical: 4,
  },
  th: { fontSize: 7, fontWeight: 700, color: "#666", textTransform: "uppercase" },
  colSku: { width: "14%" },
  colName: { width: "32%" },
  colSupplier: { width: "20%" },
  colQty: { width: "12%", textAlign: "right" },
  colTotal: { width: "22%", textAlign: "right" },
  summary: { marginTop: 16, alignSelf: "flex-end", width: "55%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomStyle: "solid",
    borderBottomColor: "#eee",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: 10,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 10, fontWeight: 700 },
  grandTotalValue: { fontSize: 16, fontWeight: 700 },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 50 },
  signatureBlock: { width: "45%" },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomStyle: "solid",
    borderBottomColor: "#999",
    marginTop: 26,
    marginBottom: 5,
  },
  signatureLabel: { fontSize: 7, color: "#888" },
});

export interface QuotePdfDocumentProps {
  company: {
    name: string;
    address: string;
    phone: string;
    website: string;
    btwNumber: string;
  };
  customer: {
    name: string;
    email: string;
    address: string;
  };
  meta: {
    date: string;
    reference: string;
    validityDays: number;
    deliveryDate: string | null;
    customerReference: string;
  };
  quote: QuoteResult;
}

export function QuotePdfDocument({ company, customer, meta, quote }: QuotePdfDocumentProps) {
  const items = sortLineItems(quote.lineItems);
  const summaryRows = buildQuoteSummaryRows(quote);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border} fixed />

        <Text style={styles.title}>OFFERTE</Text>

        <View style={styles.companyBlock}>
          <Text style={styles.companyName}>{company.name || "—"}</Text>
          {company.address ? <Text style={styles.mutedLine}>{company.address}</Text> : null}
          {company.phone ? <Text style={styles.mutedLine}>{company.phone}</Text> : null}
          {company.website ? <Text style={styles.mutedLine}>{company.website}</Text> : null}
          {company.btwNumber ? <Text style={styles.mutedLine}>BTW: {company.btwNumber}</Text> : null}
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Aan</Text>
            <Text style={styles.bold}>{customer.name || "—"}</Text>
            {customer.address ? <Text style={styles.mutedLine}>{customer.address}</Text> : null}
            {customer.email ? <Text style={styles.mutedLine}>{customer.email}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Offerte</Text>
            <View style={styles.metaRow}>
              <Text style={styles.muted}>Datum</Text>
              <Text>{meta.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.muted}>Referentie</Text>
              <Text>{meta.reference || "—"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.muted}>Geldigheid</Text>
              <Text>{meta.validityDays} dagen</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.muted}>Leverdatum</Text>
              <Text>{fmtDate(meta.deliveryDate)}</Text>
            </View>
            {meta.customerReference ? (
              <View style={styles.metaRow}>
                <Text style={styles.muted}>Uw referentie</Text>
                <Text>{meta.customerReference}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Line Items</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colSku]}>SKU</Text>
            <Text style={[styles.th, styles.colName]}>Product</Text>
            <Text style={[styles.th, styles.colSupplier]}>Supplier</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colTotal]}>Bedrag</Text>
          </View>
          {items.map((li) => (
            <View style={styles.tableRow} key={li.sku} wrap={false}>
              <Text style={styles.colSku}>{li.sku}</Text>
              <Text style={styles.colName}>{li.name}</Text>
              <Text style={styles.colSupplier}>{li.supplier}</Text>
              <Text style={styles.colQty}>{li.quantity}</Text>
              <Text style={styles.colTotal}>{formatCurrency(li.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary} wrap={false}>
          {summaryRows.map(([label, value]) => (
            <View style={styles.summaryRow} key={label}>
              <Text style={styles.muted}>{label}</Text>
              <Text>{formatCurrency(value)}</Text>
            </View>
          ))}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Totaal</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(quote.grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.signatures} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text style={styles.sectionLabel}>Voor akkoord opdrachtgever</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Datum, plaats</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Naam en handtekening</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.sectionLabel}>Voor akkoord opdrachtnemer</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Datum, plaats</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Naam en handtekening</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
