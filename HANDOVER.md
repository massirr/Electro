# Electro — Session Handover

> **How to use:** Update this file at the end of every Claude Code session.
> Read it at the start of the next one before touching any code.
> Format: newest session at the top.

---

## Template (copy for each new session)

```
## Session — YYYY-MM-DD

**Status:** [what state the app is in right now]

### Done
- item

### Decisions made
- item (and why)

### Blockers / open questions
- item

### Start here next session
1. first thing to do
```

---

## Session — 2026-06-30

**Status:** App fully runnable locally. OTP auth working end-to-end. PocketBase configured with Mailpit for local email.

### Done
- Fixed dev server port confusion — stale node process on 3000 was intercepting requests; killed it, `bun dev` now runs cleanly on 3000
- Added `screenshots/` folder (gitignored) — all Playwright session screenshots go there
- Updated `CLAUDE.md` with two rules: always save screenshots to `screenshots/`, always check `/tmp/nextjs.log` for actual dev server port
- Set up **Mailpit** for local email (`brew install mailpit`, runs on `localhost:1025` SMTP / `localhost:8025` UI)
- Configured PocketBase SMTP to point at Mailpit (see `MAILPIT_SMTP_PORT` in `.env.local`, SMTP enabled)
- Reset PocketBase superuser password: see `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` in `.env.local`
- Created first app user: `massirr7@irakozedarlo.be` (OTP auth confirmed working)

### Decisions made
- OTP auth kept (was replaced from password auth in commit `a51b1e3` — intentional, not a regression)
- Mailpit chosen over real SMTP for local dev — no credentials needed, catches all outgoing mail at `http://localhost:8025`

### Blockers / open questions
- Mailpit must be running for OTP to work locally — not yet wired into a start script or `package.json`
- PocketBase superuser password (`electro1234`) is temporary — change it after first proper login

### Start here next session
1. Start services: `mailpit &` + `./infra/pocketbase/pocketbase serve --dir=infra/pocketbase/pb_data &` + `bun dev`
2. Verify OTP works: `http://localhost:3001/login` → code lands in `http://localhost:8025`
3. Next planned feature: **supplier order export** (per-supplier CSV download) — last unbuilt item from `docs/MASTER_PLAN.md` §8
