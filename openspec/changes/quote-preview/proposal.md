## Why

The scaffold UI shell shows raw numbers in a basic table. Electricians need a clear, printable quote breakdown they can hand to a client or use to confirm pricing before ordering materials. The current page is a pipeline smoke test — not a usable deliverable.

## What Changes

Replace the inline styles + raw table in `src/app/page.tsx` with a proper `QuotePreview` component that shows:
- Labor cost (hours × rate)
- Material cost (line items)
- Subtotal, margin, VAT, grand total — each as a labelled row
- Per-supplier material breakdown (CEBO / Rexel split)
- Line items expandable section

No form input yet (that is `takeoff-entry`). Takeoff data stays hardcoded for this change.

## Capabilities

### New Capabilities
- `quote-display`: Structured, styled breakdown of a QuoteResult — labor, materials, margin, VAT, total, supplier split, line items

### Modified Capabilities
- none

## Impact

- `src/app/page.tsx` — replaced with component-based layout
- `src/components/quote/QuotePreview.tsx` — new component
- `src/components/quote/SupplierBreakdown.tsx` — new component
- `src/components/quote/LineItemsTable.tsx` — new component
- No API changes, no domain changes
