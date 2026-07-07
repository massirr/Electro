import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { QuoteResult } from "@/domain/types";
import { sortLineItems, buildQuoteSummaryRows } from "@/domain/calculators";

// PDF-scoped euro formatter. nl-BE emits "€ 2.541,00" (dot thousands, comma decimals) — matches
// the reference offerte, and avoids fr-BE's narrow no-break space (U+202F) which the built-in
// Helvetica font can't render (it showed up as "/" on any amount ≥ 1000).
const fmtEUR = (n: number) => n.toLocaleString("nl-BE", { style: "currency", currency: "EUR" });

// Materials always carry 6% BTW in the Belgian model; every catalog line item is a material.
// ponytail: constant until line items ever carry a per-line rate.
const LINE_BTW = "6%";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("nl-BE");
}

const GREEN = "#217346";

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.4 },
  border: {
    position: "absolute",
    top: 16, left: 16, right: 16, bottom: 16,
    borderWidth: 4, borderStyle: "solid", borderColor: GREEN,
  },

  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  headerLeft: { width: "55%" },
  headerRight: { width: "40%" },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: 1, marginBottom: 26 },

  logoBox: {
    alignSelf: "flex-end",
    width: 130, height: 62,
    borderWidth: 1, borderStyle: "solid", borderColor: "#cccccc", borderRadius: 4,
    alignItems: "center", justifyContent: "center",
    marginBottom: 40,
  },
  logoText: { color: "#bbbbbb", fontSize: 10, letterSpacing: 2 },

  senderLine: { color: "#333", marginBottom: 1 },
  senderGap: { height: 10 },

  label: { fontWeight: 700, marginBottom: 2 },
  line: { color: "#333", marginBottom: 1 },

  metaBlock: { marginTop: 22 },
  metaRow: { flexDirection: "row", marginBottom: 2 },
  metaLabel: { width: 110, color: "#333" },
  metaLabelBold: { width: 110, fontWeight: 700 },
  metaValue: { fontWeight: 700 },

  table: { marginTop: 34 },
  ruleThick: { borderBottomWidth: 1.5, borderBottomStyle: "solid", borderBottomColor: "#1a1a1a" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  row: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 2 },
  th: { fontWeight: 700, fontSize: 8.5 },

  colProduct: { width: "26%" },
  colArt: { width: "18%" },
  colQty: { width: "12%", textAlign: "right" },
  colTarief: { width: "16%", textAlign: "right" },
  colBtw: { width: "12%", textAlign: "right" },
  colBedrag: { width: "16%", textAlign: "right" },

  summary: { marginTop: 2 },
  summaryRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 2 },
  sumLabelCell: { width: "72%", textAlign: "right", paddingRight: 12, color: "#333" },
  sumValueCell: { width: "16%", textAlign: "right" },
  totaalRow: {
    flexDirection: "row",
    paddingVertical: 6, paddingHorizontal: 2, marginTop: 2,
    borderTopWidth: 1.5, borderTopStyle: "solid", borderTopColor: "#1a1a1a",
  },
  totaalLabel: { width: "72%", textAlign: "right", paddingRight: 12, fontWeight: 700, fontSize: 11 },
  totaalValue: { width: "16%", textAlign: "right", fontWeight: 700, fontSize: 11 },

  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 64 },
  signatureBlock: { width: "45%" },
  sigTitle: { fontWeight: 700, marginBottom: 2 },
  sigSub: { color: "#333", marginBottom: 30 },
  sigField: { color: "#333", marginBottom: 14 },
});

export interface QuotePdfDocumentProps {
  company: { name: string; address: string; phone: string; website: string; btwNumber: string };
  customer: { name: string; email: string; address: string };
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

        {/* Header: title + recipient on the left, sender contact on the right */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>OFFERTE</Text>

            <Text style={styles.label}>AAN</Text>
            <Text style={styles.line}>{customer.name || "—"}</Text>
            {customer.address ? <Text style={styles.line}>{customer.address}</Text> : null}
            {customer.email ? <Text style={styles.line}>{customer.email}</Text> : null}

            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Datum :</Text>
                <Text>{meta.date}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabelBold}>Offertedatum:</Text>
                <Text style={styles.metaValue}>{meta.reference || "—"}</Text>
              </View>
              <View style={styles.senderGap} />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Geldigheid</Text>
                <Text>{meta.validityDays} dagen</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Leverdatum</Text>
                <Text>{fmtDate(meta.deliveryDate)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Uw referentie</Text>
                <Text>{meta.customerReference || "—"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
            <Text style={styles.senderLine}>{company.name || "—"}</Text>
            {company.address ? <Text style={styles.senderLine}>{company.address}</Text> : null}
            <View style={styles.senderGap} />
            {company.phone ? <Text style={styles.senderLine}>T: {company.phone}</Text> : null}
            {company.website ? <Text style={styles.senderLine}>W: {company.website}</Text> : null}
            <View style={styles.senderGap} />
            {company.btwNumber ? <Text style={styles.senderLine}>BTW nummer: {company.btwNumber}</Text> : null}
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.ruleThick} />
          <View style={styles.headerRow}>
            <Text style={[styles.th, styles.colProduct]}>Product</Text>
            <Text style={[styles.th, styles.colArt]}>Artikelnummer</Text>
            <Text style={[styles.th, styles.colQty]}>Aantal</Text>
            <Text style={[styles.th, styles.colTarief]}>Tarief</Text>
            <Text style={[styles.th, styles.colBtw]}>BTW</Text>
            <Text style={[styles.th, styles.colBedrag]}>Bedrag</Text>
          </View>
          <View style={styles.ruleThick} />

          {items.map((li) => (
            <View style={styles.row} key={li.sku} wrap={false}>
              <Text style={styles.colProduct}>{li.name}</Text>
              <Text style={styles.colArt}>{li.sku}</Text>
              <Text style={styles.colQty}>{li.quantity.toFixed(2)}</Text>
              <Text style={styles.colTarief}>{fmtEUR(li.unitPrice)}</Text>
              <Text style={styles.colBtw}>{LINE_BTW}</Text>
              <Text style={styles.colBedrag}>{fmtEUR(li.totalPrice)}</Text>
            </View>
          ))}

          <View style={styles.ruleThick} />

          {/* Summary — keeps the correct Belgian split-VAT breakdown, styled like the reference */}
          <View style={styles.summary}>
            {summaryRows.map(([label, value]) => (
              <View style={styles.summaryRow} key={label}>
                <Text style={styles.sumLabelCell}>{label}</Text>
                <Text style={styles.sumValueCell}>{fmtEUR(value)}</Text>
              </View>
            ))}
            <View style={styles.totaalRow}>
              <Text style={styles.totaalLabel}>Totaal</Text>
              <Text style={styles.totaalValue}>{fmtEUR(quote.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Signature blocks */}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text style={styles.sigTitle}>Voor akkoord opdrachtgever</Text>
            <Text style={styles.sigSub}>Datum, Plaats</Text>
            <Text style={styles.sigField}>Naam tekeningsbevoegde</Text>
            <Text style={styles.sigField}>Handtekening tekeningsbevoegde</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.sigTitle}>Voor akkoord opdrachtnemer</Text>
            <Text style={styles.sigSub}>Datum, Plaats</Text>
            <Text style={styles.sigField}>Naam tekeningsbevoegde</Text>
            <Text style={styles.sigField}>Handtekening tekeningsbevoegde</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
