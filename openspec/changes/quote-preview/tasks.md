## 1. Components

- [ ] 1.1 Create `src/components/quote/LineItemsTable.tsx` — accepts `LineItem[]`, renders table sorted by supplier then name
- [ ] 1.2 Create `src/components/quote/SupplierBreakdown.tsx` — accepts `SupplierGroup[]`, renders per-supplier totals
- [ ] 1.3 Create `src/components/quote/QuotePreview.tsx` — accepts `QuoteResult`, composes summary rows + SupplierBreakdown + LineItemsTable

## 2. Page wiring

- [ ] 2.1 Update `src/app/page.tsx` — replace inline styles with `QuotePreview` component; remove raw JSX tables
- [ ] 2.2 Confirm Tailwind utility classes render correctly (no inline style fallback)

## 3. Verification

- [ ] 3.1 `bun dev` — page loads, all three sections visible
- [ ] 3.2 Grand total row visually distinct (accent colour / bold)
- [ ] 3.3 Line items sorted: CEBO items first, then Rexel (or alphabetical by supplier)
- [ ] 3.4 `bun test` — 28/28 still pass (no regressions)
