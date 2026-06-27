# Electro

Takeoff-to-quote tool for Belgian electricians. Enter line items, get a priced quote with labor, materials, VAT, and supplier breakdown.

---

## Stack

- **Frontend/API** — Next.js (App Router)
- **Backend** — PocketBase (embedded SQLite)
- **Runtime** — Bun

---

## Run locally

**1. Start PocketBase**
```bash
./infra/pocketbase/pocketbase serve --dir ./infra/pocketbase/pb_data
```

**2. Start the app**
```bash
bun dev
```

Visit `http://localhost:3000`

---

## Domain docs

- [`docs/domain-knowledge.md`](docs/domain-knowledge.md) — Belgian electrician business rules (VAT, catalog, quotes)
- [`AGENTS.md`](AGENTS.md) — stack conventions and quality gates
- [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) — implementation plan

---

Built by an electrician, for electricians.
