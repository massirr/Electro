## Why

The electrician's only job is to say what they need and how many. Installation hours per catalog item (e.g. 0.25h/outlet, 0.35h/3-way switch) are fixed trade knowledge — they don't change from quote to quote. Asking the user to type them manually is friction that contradicts the "quantity only" UX principle confirmed by Hugues (2026-07-01 customer feedback).

The hours input already auto-fills from `CatalogItem.defaultHu` on item select (`TakeoffForm.tsx:311`) — but the editable field is still visible, implying the user should fill it in. The fix: hide the hours column from the UI entirely. Hours are still stored in `takeoff_items.hours_per_unit` (no schema change needed), they just flow from the catalog silently.

## What Changes

- **Remove** the `h/u` column from `TakeoffForm`'s item table (the visible input at line 478–498 of `TakeoffForm.tsx`)
- **Remove** the `h/u` column header from the table header row
- **Remove** `handleHuChange`, `handleHuKeyDown` functions (no longer needed)
- **Keep** `FormRow.hoursPerUnit` internally — it is still passed to the API and stored in Supabase
- **Keep** `handleItemSelect` setting `hoursPerUnit: item.defaultHu` — this is how hours flow in
- **Keep** `isDefault` flag (still useful for future catalog management UI)
- **No schema migration** — `takeoff_items.hours_per_unit` stays, just pre-filled not user-entered
- **No API change** — the quote API still receives and uses `hoursPerUnit` per item

## Capabilities

### Modified Capabilities
- `takeoff-entry`: Item rows now show only **Item** and **Qty** columns. Hours auto-load from catalog silently. No visible hours field.

### Removed Capabilities
- `manual-hours-override`: Electricians can no longer type custom hours per row. Hours are always from catalog. (Edge case: if a specific job needs custom hours, that becomes a catalog item management feature — not scope for this change.)

## Impact

- `src/components/takeoff/TakeoffForm.tsx` — remove `<td>` hours input block, remove `h/u` header, remove `handleHuChange` and `handleHuKeyDown`; `hoursPerUnit` stays on `FormRow` type and flows from `handleItemSelect`
- `src/components/takeoff/TakeoffForm.tsx` — `onKeyDown` on Enter in the Qty field should add a row (currently that was on the hours field)
