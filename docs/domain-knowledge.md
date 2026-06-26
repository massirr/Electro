# Electro — Domain Knowledge (Belgian Electrician Quoting)

## Who uses this tool

Electricians in Belgium. Customers (homeowners, businesses) never log in — they only receive a PDF quote by email.

Primary device: laptop. Must also work on mobile.

---

## VAT (BTW in Belgium)

VAT is a government tax added on top of prices. The electrician **collects it from the customer and sends it to the government** — it is not the electrician's revenue.

### Two VAT rates for electrical work

| Work type | VAT rate | When it applies |
|-----------|----------|-----------------|
| New construction | **21%** | Building less than 10 years old |
| Renovation | **6%** | Building 10 years old or more |

The electrician decides per job which rate applies.

### Split VAT on a single quote

Belgian quotes often split VAT by line type:
- **Labor** (uurloon / hours worked): 6% or 21% depending on building age
- **Materials** (materiaal): always 6% VAT

Example quote:
```
Labor:     8 hours × €55 = €440.00  +21% VAT = €532.40
Materials: outlets, cable = €180.00  + 6% VAT = €190.80
─────────────────────────────────────────────────────────
Total incl. VAT:                               €723.20
```

The electrician selects "renovation" or "new build" per job. The app calculates VAT automatically.

**Confirmed:** VAT is always split. Labor and materials show as separate lines with their own VAT rates on every quote.

### Belgian hourly rates (2026 market rates)

- Entry-level: ~€25–40/hour
- Self-employed (zelfstandige): ~€45–55/hour excl. VAT
- Installation companies: ~€60–75/hour excl. VAT

Rates vary per electrician and per job — the tool does NOT impose a fixed rate.

---

## Key Terms

### Catalog (global item library)

The **catalog** is a shared pool of all items/services electricians can put on a quote.

Examples of catalog items:
- 16A wall outlet (stopcontact)
- Light point (lichtpunt)
- Circuit breaker 16A
- Distribution board (verdeelkast)
- Cable per meter (kabel per meter)
- Earth fault circuit interrupter (differentieelschakelaar)

Each item has:
- Name
- Default unit price (excl. VAT)
- Unit (piece, meter, hour, etc.)

**Confirmed:** Item type (labor or material) is NOT fixed at catalog level. The electrician decides per quote line whether an item counts as labor (→ 6% or 21% VAT) or material (→ always 6% VAT).

**Catalog is global** — any electrician who adds a new item makes it available to all electricians on the platform.

When an electrician overrides the price of an item on a quote, it only affects **that quote** — the global default stays untouched.

### Quote (offerte)

A **quote** is a document the electrician prepares for one specific customer/project.

The electrician:
1. Creates a new quote (customer name, address, email)
2. Picks items from the catalog, sets quantities
3. Sets hourly rate for this job
4. Selects VAT type (renovation 6% / new build 21%)
5. App calculates totals + VAT breakdown
6. Exports as PDF and emails to customer

Each quote belongs to one electrician's account. Electricians cannot see each other's quotes.

**Multiple quotes per electrician** — they may have 10 active projects at once, each with its own quote.

---

## Account & Data Model (Summary)

| What | Scope |
|------|-------|
| Quotes | Per electrician — private |
| Catalog items | Global — shared across all electricians |
| Item price overrides | Per quote only — doesn't change global default |
| Hourly rate | Set per quote — no locked global default |
| Customer history | Per electrician account |

---

## Account Types & BTW Nummer

BTW nummer does NOT change VAT rates for customers — rates are fixed by law. It determines legal responsibility on the quote.

| Account type | BTW on quote | Who files VAT |
|---|---|---|
| Solo electrician | Their own BTW number | Themselves |
| Company (BV/BVBA) | Company BTW number | Company files for all |

**Current scope (Phase 1): solo accounts only.**
- One account = one BTW number = one electrician
- BTW number stored in account profile, printed on every PDF quote

Company accounts (multiple electricians under one BTW) = deferred to Phase 2.

---

## Belgian Legal Requirements for Quotes

A Belgian offerte/factuur must include:
- Electrician's BTW nummer (VAT registration number)
- Quote/invoice reference number
- Date issued
- Customer name and address
- Itemized line items with unit prices
- VAT rate(s) and VAT amount(s)
- Subtotal excl. VAT
- Total incl. VAT

---

## Mobile Notes

Tool is used mainly on laptop. Mobile must work but secondary.
Known issue: selecting items on mobile causes viewport zoom + horizontal scroll — needs responsive layout fix.
