## Why

Hugues: "People should not go to the sites for prices." If the client sees a unit cost of €0.95/box on the PDF, they'll Google it, find it for €0.50, and question the margin. The client-facing quote should show only the total per line and the grand total — no unit prices that invite price comparison.

The screen view (on the electrician's device) keeps the full breakdown for internal reference.

## What Changes

- **In `LineItemsTable.tsx`**: the "Unit price" column header and `unitPrice` cells get `print:hidden` class — they disappear in the PDF but stay visible on screen
- **No data model change** — `unitPrice` is still calculated and stored; it's only hidden in print CSS
- **No separate PDF generation** — the existing print flow (`window.print()`) is used; CSS does the hiding

## Capabilities

### Modified Capabilities
- `quote-pdf`: Client PDF no longer shows unit prices per line item. Only the line total and grand total are visible to the client.
- `quote-display` (screen): No change — unit prices remain visible on screen for the electrician.

## Impact

- `src/components/quote/LineItemsTable.tsx` — add `print:hidden` to the "Unit" column header `<th>` and to each `<td>` that renders `unitPrice`
