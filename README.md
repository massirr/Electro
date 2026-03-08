# Electro

Tool for electricians: Takeoff → Quote → Supplier Orders.

---

## MVP Scope

- Manual takeoff entry (no PDF/DWG parsing)
- Quote calculation (labor + materials + VAT + margin)
- Product mapping (takeoff items → SKUs via kits)
- Export supplier orders (CEBO, Rexel) as CSV

---

## Status

Planning scaffold complete. Sample data exists, implementation not started.

- Agent workflow: [AGENTS.md](AGENTS.md)
- Next work queue: [docs/PHASE_01_PLAN.md](docs/PHASE_01_PLAN.md)
- Initial DB schema: [docs/db-schema.sql](docs/db-schema.sql)

---

## Project Structure

```text
.
├── AGENTS.md
├── data/
│   ├── README.md
│   └── sample-inputs/
├── docs/
│   ├── PHASE_01_PLAN.md
│   ├── db-schema.sql
│   └── design/
│       └── Hugues.excalidraw
├── infra/
│   └── podman-compose.yml
├── src/
└── README.md
```

---

## Source Code Layout

Suggested first build layout:

```text
src/
  domain/        # core formulas and types
  io/            # file parsing + CSV export
  app/           # pipeline/use-cases
  index.ts       # entrypoint
```

Detailed implementation order is in `docs/PHASE_01_PLAN.md`.

---

Built by an electrician, for electricians.
