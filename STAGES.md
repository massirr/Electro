# Stages

Track progress here. Tick boxes as you build.

---

## Stage 1 — Takeoff to Quote

**Goal:** Enter takeoff data, get a quote with labor + materials.

- [ ] Takeoff input form (quantities per item type)
- [ ] Settings form (hourly rate, VAT %, margin %)
- [ ] Calculate labor cost (quantities × hours × rate)
- [ ] Calculate materials cost (placeholder or manual entry)
- [ ] Show quote totals (labor + materials + VAT)
- [ ] Export quote as CSV
- [ ] Basic UI (web or desktop — TBD)

**Done when:** You can enter a takeoff, set pricing, and see/export a quote.

---

## Stage 2 — Product Mapping

**Goal:** Map takeoff items to real products (SKUs) from a catalog.

- [ ] Product catalog UI (view/add/edit products)
- [ ] Import catalog from CSV
- [ ] Kit mapping (define which SKUs make up each takeoff item)
- [ ] Generate SKU list from takeoff
- [ ] Show SKU quantities needed
- [ ] Export SKU list as CSV

**Done when:** You can map takeoff → SKUs and export a full product list.

---

## Stage 3 — Order Lists

**Goal:** Split SKU list by supplier, ready to order.

- [ ] Assign suppliers to products (CEBO, Rexel, other)
- [ ] Split SKU list by supplier
- [ ] Export CEBO order as CSV
- [ ] Export Rexel order as CSV
- [ ] Handle products without assigned supplier (flag/warn)

**Done when:** You can generate supplier-specific order files from a takeoff.

---

## Future (Post-MVP)

- [ ] Save/load projects
- [ ] Price history tracking
- [ ] Automatic price updates from suppliers
- [ ] PDF quote generation
- [ ] Multi-project comparison
- [ ] Mobile support

---

## Version Tags (Optional)

- `v0.1` — Stage 1 complete
- `v0.2` — Stage 2 complete
- `v0.3` — Stage 3 complete (MVP done)
