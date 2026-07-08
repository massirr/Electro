## Why

The electrician thinks of items as "things I pick from the supplier's shelf." After quoting, they need to actually order those items. Currently `SupplierBreakdown.tsx` shows the grouped list on screen — but the electrician has to re-enter items manually in the supplier's website or on paper.

A CSV export per supplier (or a single combined CSV with a Supplier column) eliminates that re-entry. This is `docs/MASTER_PLAN.md §8` (last unbuilt planned feature).

## What Changes

- **New button** in `SupplierBreakdown.tsx`: "Export CSV" per supplier group (or one "Export All" button that includes all suppliers with a Supplier column)
- **CSV format per supplier**: `SKU, Name, Quantity, Unit Price, Total`
- **Combined export format** (if one button preferred): `Supplier, SKU, Name, Quantity, Unit Price, Total`
- **Client-side generation** — no API call needed; `LineItem[]` data is already in the component. Generate CSV string in JS, trigger download via `URL.createObjectURL(new Blob(...))`.
- No schema changes. No new API routes.

## Decision: one button or per-supplier?

Recommendation: one "Export CSV" button that downloads all suppliers in a single file with a Supplier column. One click is enough — the electrician can filter by supplier in Excel/Numbers/Google Sheets. Per-supplier buttons add UI noise for little benefit.

## Capabilities

### New Capabilities
- `supplier-csv-export`: One button on the Supplier Breakdown section. Downloads `supplier-order.csv` with all line items grouped by supplier. Works entirely client-side.

## Impact

- `src/components/quote/SupplierBreakdown.tsx` — add "Export CSV" button; add `exportSupplierCSV(groups: SupplierGroup[])` helper function that builds CSV string and triggers download
- No API route, no schema changes, no new files needed
