# MVP Scope

## What's IN

### Stage 1 — Takeoff to Quote
- Manual takeoff entry (no PDF/DWG parsing)
- Pricing settings (hourly rate, VAT, margin)
- Labor cost calculation
- Material cost calculation (manual or estimated)
- Quote total display
- Export quote as CSV

### Stage 2 — Product Mapping
- Product catalog (add/edit/view products)
- CSV import for catalog
- Kit mapping (takeoff item → list of SKUs)
- Generate SKU list from takeoff
- Export SKU list as CSV

### Stage 3 — Order Lists
- Assign supplier to each product
- Split SKU list by supplier
- Export supplier-specific orders (CEBO, Rexel)
- CSV format for easy copy-paste ordering

---

## What's OUT (for now)

### Not in MVP:
- PDF/DWG plan parsing
- Automatic price updates from suppliers
- Database sync with supplier catalogs
- PDF quote generation (fancy branded outputs)
- Project save/load (local storage only, if needed)
- Multi-user / team features
- Cloud storage or sharing
- Mobile app
- Integration with accounting software
- Inventory tracking
- Purchase order management

---

## Technical constraints

### MVP will:
- Work offline (local-first)
- Run on desktop (web or native — TBD)
- Store data locally (JSON files or simple DB)
- Use simple UI (functional, not fancy)

### MVP won't:
- Require internet connection
- Need user accounts or auth
- Sync across devices
- Handle concurrent users

---

## Success criteria

**MVP is done when:**

1. You can enter a takeoff manually
2. You get a quote with labor + materials
3. You map takeoff items to SKUs
4. You export supplier-specific order CSVs
5. You can use it for real jobs

**MVP is successful when:**
- It saves you time on actual jobs
- The numbers are accurate enough to trust
- You'd rather use this than a spreadsheet

---

## Assumptions

- You're comfortable entering takeoffs manually (no auto-extraction)
- You'll maintain your product catalog yourself
- You order from 1-2 main suppliers (CEBO, Rexel)
- CSV export is good enough for ordering
- You don't need fancy reports yet

---

## Out of scope (future features)

These might come later, but NOT in MVP:

- Price history tracking
- Multi-project comparison
- Template takeoffs (common job types)
- Automatic labor hour estimation
- Supplier API integration
- Email quotes to clients
- Mobile version
- Cloud backup
