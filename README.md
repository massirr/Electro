# Electro

Quoting tool for electrical contractors. Enter your job items, get a full priced quote with labour, materials, VAT, and a supplier order breakdown — ready to print or share as a PDF.

Built for Belgian electricians. Self-hostable. Open source.

**Live demo:** [electro-quote.vercel.app](https://electro-quote.vercel.app)

---

## Features

- **Quote builder** — add kit items (outlets, panels, wire runs, etc.), set quantities, get a full breakdown instantly
- **Catalog management** — edit your product prices and kit assemblies in-app, no code changes needed
- **VAT-aware** — renovation (6%) and new-build (21%) rates with automatic BTW calculation
- **PDF export** — print-ready quote with your name and BTW number; unit costs hidden from the customer view
- **Supplier CSV export** — one-click order sheet grouped by supplier (Rexel, CEBO, etc.)
- **Quote duplication** — clone any saved quote as a starting point for a new job
- **Passwordless auth** — magic link sign-in, no passwords to manage
- **Auto sign-out** — session ends after 1 hour of inactivity
- **Dark / light mode**

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database & Auth | Supabase (Postgres + RLS) |
| Runtime | Bun |
| Hosting | Vercel (auto-deploys on push to `main`) |
| Styling | Tailwind CSS 4 |

---

## Self-hosting

### 1. Clone the repo

```bash
git clone https://github.com/massirr/Electro.git
cd Electro
bun install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the SQL Editor, run the three migration files in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_catalog.sql`
   - `supabase/migrations/003_catalog_owner_nullable.sql`
3. Under **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (change to your domain in production)
   - Redirect URLs: `http://localhost:3000/**`

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these in your Supabase project under **Settings → API**.

> The service role key is server-only and never exposed to the browser. Keep it out of version control.

### 4. Run locally

```bash
bun dev
```

Visit `http://localhost:3000`. Sign in with your email — Supabase sends a magic link. Your catalog is seeded automatically on first login.

### 5. Deploy to Vercel

```bash
# Connect to Vercel once
npx vercel link

# Add the three env vars in Vercel dashboard → Settings → Environment Variables
# Then deploy:
git push origin main
```

Vercel auto-deploys every push to `main`. Update your Supabase redirect URL to your production domain.

---

## Project structure

```
src/
  app/                  # Next.js App Router pages and API routes
    api/catalog/        # CRUD for products and kit assemblies
    api/quotes/         # Quote save, list, delete, duplicate
    api/quote/          # Quote calculation engine
    api/account/        # Account deletion
    catalog/            # Catalog management UI
    profile/            # User profile (name, BTW, hourly rate)
  components/
    catalog/            # ProductsTable, KitsTable
    quote/              # QuotePreview, LineItemsTable, SupplierBreakdown
    takeoff/            # TakeoffForm (main quote builder)
  hooks/                # useAuth, useQuote, useInactivityLogout
  lib/
    supabase/           # Supabase server/client helpers
    catalog-seed.ts     # Auto-seeds default catalog on first login
supabase/
  migrations/           # SQL migrations (apply via Supabase SQL Editor)
docs/
  domain-knowledge.md   # Belgian electrician business rules (VAT, BTW, catalog)
```

---

## Importing supplier prices

Rather than typing prices manually, you can import a CSV price list directly from your supplier's B2B portal. The importer auto-detects the column delimiter (`,` or `;`) and lets you map columns before importing. Existing products are updated by SKU — no duplicates created.

### Cebeo

1. Log in at [b2b.cebeo.be](https://b2b.cebeo.be)
2. Go to **Export** in the top menu
3. Choose format **CSV** (or XLSX saved as CSV)
4. Go to **Catalog → Import CSV** in Electro and upload the file

### Rexel

1. Log in at [rexel.be](https://www.rexel.be) (Netstore account)
2. **My account → Price list → Export**
3. Choose CSV format
4. Go to **Catalog → Import CSV** in Electro and upload the file

### Column mapping

After uploading, Electro shows your file's column headers and guesses which maps to SKU, Name, Price, Supplier, and Category based on the header name (supports Dutch and French column names). Adjust any mismatches with the dropdowns before confirming the import.

> **Prices are customer-specific.** Belgian suppliers (Cebeo, Rexel) negotiate rates per account, so the prices in your export reflect your actual net prices — not public catalog rates.

---

## Domain knowledge

Belgian-specific rules are documented in [`docs/domain-knowledge.md`](docs/domain-knowledge.md):

- VAT rates: 6% renovation, 21% new-build
- BTW number format: `BE 0123.456.789`
- Supplier catalogue structure (Rexel, CEBO)
- Kit assembly model (labour hours per unit, component SKUs)

---

## License

MIT — see [LICENSE](LICENSE)
