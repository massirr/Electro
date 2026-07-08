# OpenSpec — Catalog Management UI

**Status:** Draft  
**Date:** 2026-07-01  
**Author:** massirr

---

## Why

The product catalog (prices) and kit catalog (assembly items + default hours) are hardcoded
in static files (`sample-catalog.csv`, `sample-kits.json`). Adding a new item type or updating
a price requires editing files and redeploying. Hugues needs to manage his own catalog in-app
without touching code — especially to enter real negotiated prices from Rexel and CEBO.

---

## What Changes

### Data layer
- Move `catalog_products` (SKU, name, supplier, price, category) and `catalog_kits`
  (slug, name, default_hu) + `catalog_kit_components` (kit → SKU mapping) into Supabase.
- Each user owns their own catalog rows (RLS: `owner = auth.uid()`).
- Auto-seed from the default JSON/CSV on first use so Hugues doesn't start empty.

### API layer
- `/api/catalog` — reads `catalog_kits` from DB (replaces JSON file read)
- `/api/quote` — reads `catalog_products` from DB (replaces CSV file read)
- New `/api/catalog/products` — CRUD (GET list, POST create, PUT update, DELETE)
- New `/api/catalog/kits` — CRUD for kit name + default hours

### UI layer
- New `/catalog` page with two tabs: **Products** and **Kits**
- Products tab: table of all products with inline edit for name, supplier, price, category; add row; delete row
- Kits tab: list of kits with edit for name and default hours (h/u); add new kit (name + h/u only, no component editing)
- Nav link added in NavBar

---

## Capabilities

1. Hugues can update any product price to his real Rexel/CEBO negotiated rate
2. Hugues can add a new product SKU with supplier and price
3. Hugues can change the default hours per unit on any kit (e.g., bump 200A panel from 4h to 6h)
4. Hugues can add a new kit type (name + h/u) — components managed separately via a future spec
5. All changes take effect immediately on the next quote calculation

---

## Out of Scope (v1)

- CSV bulk import
- Catalog sharing between users

---

## Impact

| File | Change |
|------|--------|
| `supabase/migrations/002_catalog.sql` | New tables: catalog_products, catalog_kits, catalog_kit_components |
| `src/app/api/catalog/route.ts` | Read from DB instead of JSON |
| `src/app/api/quote/route.ts` | Read products from DB instead of CSV |
| `src/app/api/catalog/products/route.ts` | New — CRUD for products |
| `src/app/api/catalog/kits/route.ts` | New — CRUD for kits (name + default_hu only) |
| `src/app/catalog/page.tsx` | New — catalog management page |
| `src/components/catalog/ProductsTable.tsx` | New — products tab UI |
| `src/components/catalog/KitsTable.tsx` | New — kits tab UI |
| `src/components/NavBar.tsx` | Add Catalog nav link |
