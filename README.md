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

## Domain knowledge

Belgian-specific rules are documented in [`docs/domain-knowledge.md`](docs/domain-knowledge.md):

- VAT rates: 6% renovation, 21% new-build
- BTW number format: `BE 0123.456.789`
- Supplier catalogue structure (Rexel, CEBO)
- Kit assembly model (labour hours per unit, component SKUs)

---

## License

MIT — see [LICENSE](LICENSE)
