## 1. Components

- [x] 1.1 Create `src/components/quote/LineItemsTable.tsx` — accepts `LineItem[]`, renders table sorted by supplier then name
- [x] 1.2 Create `src/components/quote/SupplierBreakdown.tsx` — accepts `SupplierGroup[]`, renders per-supplier totals
- [x] 1.3 Create `src/components/quote/QuotePreview.tsx` — accepts `QuoteResult`, composes summary rows + SupplierBreakdown + LineItemsTable

## 2. Page wiring

- [x] 2.1 Update `src/app/page.tsx` — replace inline styles with `QuotePreview` component; remove raw JSX tables
- [x] 2.2 Confirm Tailwind utility classes render correctly (no inline style fallback)

## 3. Verification

- [x] 3.1 `bun dev` — page loads, all three sections visible
- [x] 3.2 Grand total row visually distinct (accent colour / bold)
- [x] 3.3 Line items sorted: CEBO items first, then Rexel (or alphabetical by supplier)
- [x] 3.4 `bun test` — 28/28 still pass (no regressions)
