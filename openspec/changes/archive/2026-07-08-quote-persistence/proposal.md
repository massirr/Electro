## Why

Quotes disappear on page refresh. Electricians need to save, list, and reload quotes across sessions — one per project, many per user. PocketBase is already running locally with the `projects` and `takeoff_items` collections scaffolded but unused.

## What Changes

- **BREAKING**: Replace `vatPercent: number` field in PocketBase `projects` collection with `jobType: text` (matches vat-split change)
- Add PocketBase client singleton (`src/lib/pb.ts`)
- Add save/list/load/delete API routes for quotes
- Add a quotes list sidebar or panel on the main page
- Wire "Save Quote" action to the takeoff form
- Wire "Load Quote" from the list to restore the form state
- No auth yet — MVP uses open rules; auth is a follow-up spec

## Capabilities

### New Capabilities
- `quote-save`: Save current takeoff (items + settings) as a named project in PocketBase
- `quote-list`: List all saved quotes with name, date, grand total
- `quote-load`: Load a saved quote back into the takeoff form
- `quote-delete`: Delete a saved quote

### Modified Capabilities
- `quote-display`: Quote preview gains a "Save" button

## Impact

- `infra/pocketbase/pb_migrations/` — new migration replacing `vatPercent` with `jobType` in projects
- `src/lib/pb.ts` — new PocketBase client singleton
- `src/app/api/quotes/` — new CRUD routes (list, save, load, delete)
- `src/components/takeoff/TakeoffForm.tsx` — save button + load callback
- `src/app/page.tsx` — quotes list panel alongside the form
