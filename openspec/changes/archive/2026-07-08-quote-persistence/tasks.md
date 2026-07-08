## 1. PocketBase Migration

- [ ] 1.1 Create migration: replace `vatPercent` with `jobType` (text, required) in projects collection
- [ ] 1.2 Add `grandTotal` (number) field to projects collection in same migration
- [ ] 1.3 Add `customer_name` and `customer_email` (text, optional) fields to projects collection

## 2. PocketBase Client

- [ ] 2.1 Create `src/lib/pb.ts` — singleton PocketBase client using `POCKETBASE_URL` env var
- [ ] 2.2 Add `POCKETBASE_URL=http://127.0.0.1:8090` to `.env.local`
- [ ] 2.3 Update collection access rules in migration: allow list/create/update/delete without auth (MVP)

## 3. API Routes

- [ ] 3.1 POST `/api/quotes` — save project + takeoff_items, return `{ id, name }`
- [ ] 3.2 GET `/api/quotes` — list all projects sorted newest first, return `{ id, name, projectDate, grandTotal }[]`
- [ ] 3.3 GET `/api/quotes/[id]` — return project + its takeoff_items
- [ ] 3.4 DELETE `/api/quotes/[id]` — delete takeoff_items then project, return 204

## 4. UI — Quotes List Panel

- [ ] 4.1 Create `src/components/quotes/QuotesList.tsx` — renders list of saved quotes with load + delete actions
- [ ] 4.2 Add save button + project name input to TakeoffForm (or QuotePreview area)
- [ ] 4.3 Wire save: POST /api/quotes with current rows + settings from TakeoffForm
- [ ] 4.4 Wire load: GET /api/quotes/[id] then restore rows + settings in TakeoffForm
- [ ] 4.5 Wire delete: DELETE /api/quotes/[id] then refresh list
- [ ] 4.6 Update `src/app/page.tsx` — side-by-side layout with QuotesList + TakeoffForm

## 5. Verification

- [ ] 5.1 Start PocketBase (`./infra/pocketbase/pocketbase serve`) and confirm it starts
- [ ] 5.2 Save a quote, verify it appears in the list
- [ ] 5.3 Load the quote, verify rows + settings restore correctly
- [ ] 5.4 Delete the quote, verify it disappears from the list
- [ ] 5.5 Verify grandTotal in list matches QuotePreview total
