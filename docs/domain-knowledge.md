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

## Customer Feedback — Hugues (2026-07-01)

Validated in a live demo session. Key insights that change how the tool should work:

### "Quantity only" — the core UX principle
The electrician's job is to know what they need and how many. Everything else (price, installation time, supplier) should already be in the system. The only input per item should be **quantity**.

This means:
- **Installation hours per item must be pre-configured in the catalog**, not entered manually per row. A 3-way switch always takes ~0.35h to install — the electrician should not have to remember or type this.
- **Prices come from the catalog**, not looked up on supplier websites. The electrician should never leave the app to find a price.

### Hiding cost prices from the client
"People should not go to the sites for prices." The client-facing quote (PDF) should show the **margin-included final price**, not the underlying supplier cost. If the client sees €0.95/unit for a box, they'll Google it and question the margin.
- Client PDF: show totals and Grand Total — **no unit cost prices**
- Internal view (on screen): can show full breakdown

### Quote duplication
Electricians reuse quotes. A renovation in house A is often 80% the same as house B. They need to:
1. Duplicate an existing quote
2. Open the copy and adjust quantities or swap a few items
3. Save as a new quote for the new customer

### Supplier inventory mental model
The electrician thinks of items as "things I pick from the supplier's shelf." When they design a job, they already know what they'll order — they're not pricing from scratch, they're selecting from a known set of items and entering how many they need. This reinforces the catalog-driven, quantity-only approach.

### Real supplier prices (future)
Ideal state: prices automatically sourced from Belgian electrical suppliers (Rexel, CEBO, etc.) so the catalog stays current without manual updates. Not in scope now, but the data model should not prevent it.

---

## Authentication

**Method: OTP (one-time password) — passwordless.**

No passwords stored or managed. Flow:
1. User enters email address
2. PocketBase sends a short numeric code to that email
3. User enters the code → signed in
4. First-time users are created automatically (no separate registration step)

This is also called "magic link" or "passwordless email auth." The difference from a true magic link: instead of clicking a URL, the user types a code. Both are equally secure; codes work better on mobile (no switching apps).

### Setup requirement

OTP must be enabled in PocketBase admin UI:
1. Go to `http://localhost:8090/_/` → Collections → users → Auth
2. Enable "OTP" toggle
3. Enable "Create missing users" (allows first login = account creation)
4. Configure SMTP under Settings → Mail settings (required for emails to send)

For local development: use [Mailpit](https://mailpit.axllent.org/) as a local SMTP catcher — it intercepts emails without sending them, letting you see codes in a web UI.

---

## Mobile Notes

Tool is used mainly on laptop. Mobile must work but secondary.
