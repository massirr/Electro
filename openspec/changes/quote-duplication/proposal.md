## Why

An electrician's jobs are often similar. A kitchen renovation in one house is ~80% the same as the next one — same outlets, same light points, same wiring. Currently they must re-enter every item from scratch. Hugues confirmed (2026-07-01): "Duplicate an existing quote, open the copy and adjust quantities or swap a few items, save as new quote for the new customer."

This is a standard CRUD operation on top of the existing `projects` + `takeoff_items` schema — no new data model needed.

## What Changes

- **New API route**: `POST /api/quotes/[id]/duplicate` — reads the source project + items, inserts a copy with `name: "Copy of <original name>"` and no customer info (blank `customerName/Email/Address`), same `hourlyRate/marginPercent/jobType`, same items, `grandTotal: 0` (recalculated on load). Returns the new project's `id`.
- **New UI**: Add a "Duplicate" icon button on each row in the saved quotes list (alongside the existing delete button). On click: call the API, reload the list. The new quote appears at the top.

## Capabilities

### New Capabilities
- `quote-duplicate`: Copies a saved quote (items + settings) as a new project. Customer fields are blank on the copy (ready for a new customer). The copy appears in the list immediately.

### Modified Capabilities
- `quote-list`: Each quote row gains a duplicate button (copy icon, same style as delete).

## Impact

- `src/app/api/quotes/[id]/duplicate/route.ts` — new file: `POST` handler that reads source project + takeoff_items, inserts copies, returns new `{id}`
- `src/app/page.tsx` — add duplicate button to the quotes list row; call the new API and refresh the list
- No schema changes needed — uses existing `projects` + `takeoff_items` tables
