# Next Steps

This is the practical build order for the MVP.

Use this alongside the learning workflow in `docs/LEARNING-PROCESS.md`.

## Locked Stack Decisions

- Web app framework: `Next.js` (App Router) + TypeScript
- Styling/UI: `Tailwind CSS` + `shadcn/ui`
- UI motion: minimal `GSAP` (`@gsap/react`) during UI phase only
- Auth: `PocketBase auth` for the MVP
- Backend data store: `PocketBase` with embedded `SQLite`
- Schema model: PocketBase collections in `docs/pocketbase-schema.md`
- ORM/query layer: not needed for the MVP while PocketBase is the backend

## Stage 1: Takeoff to Quote (do this now)

- Backend-first implementation.
- Implement core modules in `src/`:
  - load takeoff JSON
  - load catalog CSV
  - load kits JSON
  - calculate labor total
  - calculate material total from kit expansion
  - apply margin and VAT
- Backend outputs:
  - quote summary in terminal
  - API response payload
  - `quote.csv` export
- Add tests for calculation/API correctness using sample data.
- Keep quote calculation in server-side TypeScript code, not PocketBase hooks, for the first pass.

## Stage 2: Product Mapping

- Add validation:
  - missing SKU in catalog
  - missing kit for takeoff item
- Generate required SKU quantities from takeoff + kits.
- Export complete SKU list CSV.

## Stage 3: Supplier Orders

- Group SKUs by supplier (`CEBO`, `Rexel`, other).
- Export one CSV per supplier.
- Fail with clear warnings for products without supplier.

## Stage 4: UI Wiring (after backend tests pass)

- Build UI on top of stable backend routes/services.
- Add minimal GSAP animations only for:
  - first-load reveal,
  - key CTA emphasis,
  - one transition in quote preview.
- Keep animation optional and lightweight.

## First Concrete Task

Create this initial layout:

```text
src/
  domain/
    types.ts
    calculators.ts
  io/
    load-takeoff.ts
    load-catalog.ts
    load-kits.ts
    export-csv.ts
  app/
    quote.ts
  index.ts
tests/
  quote.test.ts
```

Then implement `src/index.ts` to run the quote pipeline against `data/sample-inputs/*`.

## PocketBase First Milestone (before UI)

1. Start PocketBase locally.
2. Create collections from `docs/pocketbase-schema.md`.
3. Seed PocketBase from the sample input files.
4. Validate these outputs through API queries or backend tests:
   - quote labor/material totals
   - required SKU quantities
   - supplier split draft
5. Add auth-protected access to project data using PocketBase auth.

## Quick Explanation: "CLI + DB"

- `CLI` means a terminal command you run locally (for example: `npm run quote:sample`).
- `DB` means your PocketBase-backed data store.
- `CLI + DB first` means:
  - build and test all core backend logic with terminal commands and database tests,
  - then add UI pages after backend behavior is stable.

## Recommended Auth Choice

Use PocketBase auth now.

Reasoning:

- it is the shortest path to a working MVP
- it keeps auth and data in one backend
- it avoids adding Auth.js session plumbing before there is a real need

Revisit Auth.js only if future requirements demand a separate auth layer.

## Learning Control Rule

- Before each micro-step, prepare the approval checklist from `docs/LEARNING-PROCESS.md`.
- Implement only after the checklist is approved.
