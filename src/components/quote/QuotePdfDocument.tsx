import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { QuoteResult } from "@/domain/types";
import { sortLineItems } from "@/domain/calculators";

export type QuoteLanguage = "en" | "fr" | "nl";

// Locale tag per language for currency/date formatting (Belgian conventions).
// nl-BE/en-BE emit "€ 2.541,00"; fr-BE would emit a narrow no-break space (U+202F) as the
// thousands separator, which the built-in Helvetica font can't render (shows as "/"), so the
// French offerte formats money with fr-CA which uses a normal space + "$"→ no; use nl-BE digits
// with a leading € for all — keep it simple and glyph-safe.
const MONEY_LOCALE: Record<QuoteLanguage, string> = { en: "nl-BE", fr: "nl-BE", nl: "nl-BE" };
const DATE_LOCALE: Record<QuoteLanguage, string> = { en: "en-GB", fr: "fr-BE", nl: "nl-BE" };

// All user-facing PDF strings, keyed by language. This is the per-quote dictionary the
// multilingual-app spec will fold into the shared message catalog later.
const LABELS: Record<QuoteLanguage, Record<string, string>> = {
  nl: {
    title: "OFFERTE", to: "AAN", date: "Datum :", quoteRef: "Offertedatum:",
    validity: "Geldigheid", days: "dagen", delivery: "Leverdatum", yourRef: "Uw referentie",
    vatNo: "BTW nummer",
    product: "Product", itemNo: "Artikelnummer", qty: "Aantal", rate: "Tarief", vat: "BTW", amount: "Bedrag",
    labor: "Arbeid", materials: "Materialen", subtotal: "Subtotaal", margin: "Marge",
    laborVat: "BTW arbeid", materialsVat: "BTW materialen", total: "Totaal",
    approvedClient: "Voor akkoord opdrachtgever", approvedContractor: "Voor akkoord opdrachtnemer",
    datePlace: "Datum, Plaats", signerName: "Naam tekeningsbevoegde", signature: "Handtekening tekeningsbevoegde",
  },
  fr: {
    title: "DEVIS", to: "À", date: "Date :", quoteRef: "N° de devis :",
    validity: "Validité", days: "jours", delivery: "Date de livraison", yourRef: "Votre référence",
    vatNo: "N° TVA",
    product: "Produit", itemNo: "Référence", qty: "Quantité", rate: "Tarif", vat: "TVA", amount: "Montant",
    labor: "Main d'œuvre", materials: "Matériaux", subtotal: "Sous-total", margin: "Marge",
    laborVat: "TVA main d'œuvre", materialsVat: "TVA matériaux", total: "Total",
    approvedClient: "Bon pour accord (client)", approvedContractor: "Bon pour accord (prestataire)",
    datePlace: "Date, Lieu", signerName: "Nom du signataire", signature: "Signature du signataire",
  },
  en: {
    title: "QUOTE", to: "TO", date: "Date:", quoteRef: "Quote no.:",
    validity: "Validity", days: "days", delivery: "Delivery date", yourRef: "Your reference",
    vatNo: "VAT no.",
    product: "Product", itemNo: "Item no.", qty: "Qty", rate: "Rate", vat: "VAT", amount: "Amount",
    labor: "Labor", materials: "Materials", subtotal: "Subtotal", margin: "Margin",
    laborVat: "Labor VAT", materialsVat: "Materials VAT", total: "Total",
    approvedClient: "Approved by client", approvedContractor: "Approved by contractor",
    datePlace: "Date, Place", signerName: "Name of signatory", signature: "Signature of signatory",
  },
};

// Materials always carry 6% BTW in the Belgian model; every catalog line item is a material.
// ponytail: constant until line items ever carry a per-line rate.
const LINE_BTW = "6%";

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
  language?: QuoteLanguage;
}

export function QuotePdfDocument({ company, customer, meta, quote, language = "nl" }: QuotePdfDocumentProps) {
  const t = LABELS[language];
  const fmtEUR = (n: number) =>
    n.toLocaleString(MONEY_LOCALE[language], { style: "currency", currency: "EUR" });
  const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString(DATE_LOCALE[language]) : "—";

  const items = sortLineItems(quote.lineItems);
  const laborVatPct = quote.jobType === "renovation" ? "6%" : "21%";
  const summaryRows: [string, number][] = [
    [t.labor, quote.laborTotal],
    [t.materials, quote.materialTotal],
    [t.subtotal, quote.subtotal],
    [t.margin, quote.margin],
    [`${t.laborVat} ${laborVatPct}`, quote.laborVat],
    [`${t.materialsVat} 6%`, quote.materialVat],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border} fixed />

        {/* Header: title + recipient on the left, sender contact on the right */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t.title}</Text>

            <Text style={styles.label}>{t.to}</Text>
            <Text style={styles.line}>{customer.name || "—"}</Text>
            {customer.address ? <Text style={styles.line}>{customer.address}</Text> : null}
            {customer.email ? <Text style={styles.line}>{customer.email}</Text> : null}

            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t.date}</Text>
                <Text>{meta.date}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabelBold}>{t.quoteRef}</Text>
                <Text style={styles.metaValue}>{meta.reference || "—"}</Text>
              </View>
              <View style={styles.senderGap} />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t.validity}</Text>
                <Text>{meta.validityDays} {t.days}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t.delivery}</Text>
                <Text>{fmtDate(meta.deliveryDate)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t.yourRef}</Text>
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
            {company.btwNumber ? <Text style={styles.senderLine}>{t.vatNo}: {company.btwNumber}</Text> : null}
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.ruleThick} />
          <View style={styles.headerRow}>
            <Text style={[styles.th, styles.colProduct]}>{t.product}</Text>
            <Text style={[styles.th, styles.colArt]}>{t.itemNo}</Text>
            <Text style={[styles.th, styles.colQty]}>{t.qty}</Text>
            <Text style={[styles.th, styles.colTarief]}>{t.rate}</Text>
            <Text style={[styles.th, styles.colBtw]}>{t.vat}</Text>
            <Text style={[styles.th, styles.colBedrag]}>{t.amount}</Text>
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

          {/* Summary — correct Belgian split-VAT breakdown, styled like the reference */}
          <View style={styles.summary}>
            {summaryRows.map(([lbl, value]) => (
              <View style={styles.summaryRow} key={lbl}>
                <Text style={styles.sumLabelCell}>{lbl}</Text>
                <Text style={styles.sumValueCell}>{fmtEUR(value)}</Text>
              </View>
            ))}
            <View style={styles.totaalRow}>
              <Text style={styles.totaalLabel}>{t.total}</Text>
              <Text style={styles.totaalValue}>{fmtEUR(quote.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Signature blocks */}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text style={styles.sigTitle}>{t.approvedClient}</Text>
            <Text style={styles.sigSub}>{t.datePlace}</Text>
            <Text style={styles.sigField}>{t.signerName}</Text>
            <Text style={styles.sigField}>{t.signature}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.sigTitle}>{t.approvedContractor}</Text>
            <Text style={styles.sigSub}>{t.datePlace}</Text>
            <Text style={styles.sigField}>{t.signerName}</Text>
            <Text style={styles.sigField}>{t.signature}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
