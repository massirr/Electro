# OpenSpec — Multilingual App (English, French, Dutch)

**Status:** Draft
**Date:** 2026-07-04
**Author:** massirr

---

## Why

Belgium has three language regions (Flanders: Dutch, Wallonia: French, Brussels: bilingual), and
an electrician's customers may not share the electrician's own working language. The whole app UI
needs to support English (current), French, and Dutch — and, separately, each individual quote
sent to a customer needs its own language, independent of whichever language the electrician is
using the app in that day.

---

## Research: what's needed

- **`next-intl`** is the standard i18n library for the Next.js App Router (Next 15, used here) and
  is the recommended choice — it handles both whole-app UI translation and per-request locale
  resolution without a framework rewrite.
- Recommend **URL-prefixed locales** (`/en/...`, `/fr/...`, `/nl/...`) over cookie-only "as-needed"
  mode: it's the more robust option with Next's static rendering, and a quote/login link shared
  with someone carries its own language rather than depending on browser/cookie state.
- The existing Supabase auth middleware (`src/middleware.ts`) already intercepts every request for
  session refresh — locale routing needs to compose with it carefully (next-intl's own middleware
  can be chained before/after the Supabase one) rather than replacing it. This is the main
  integration risk in this proposal and should get explicit attention in eng-review.
- Currency/date formatting already goes through `toLocaleString` (currently hardcoded `fr-BE` in
  `QuotePreview`) — this needs to switch its locale tag based on the selected language instead.

This is a **wide-diff proposal**: nearly every component with user-facing text needs its strings
extracted into message dictionaries. Recommend sequencing this after `professional-quote-pdf`
ships (with that proposal's PDF template already written against translation keys rather than
hardcoded copy), so this proposal only has to add translations rather than also restructure the
new template.

---

## What Changes

### Framework
- Add `next-intl`, configure App Router locale routing under `/en`, `/fr`, `/nl` (default `/en`,
  matching "English (current)")
- `messages/en.json`, `messages/fr.json`, `messages/nl.json` — dictionaries for every user-facing
  string across nav, home/onboarding, takeoff form, catalog (products + kits), profile, login,
  quote preview labels

### UI
- Language switcher in `NavBar` for the electrician's **own** app UI language, persisted via the
  locale URL segment
- All hardcoded strings in existing components moved to `useTranslations()` calls against the
  message dictionaries

### Per-quote language (independent of the electrician's UI language)
- `projects`: add `language` column (`en` | `fr` | `nl`), selectable when creating/editing a quote
- The `QuotePdfDocument` template (from `professional-quote-pdf`) reads its labels from the same
  message dictionaries, keyed by the quote's `language` field — **not** the electrician's own
  session locale. A French-speaking electrician can send a Dutch customer a Dutch offerte without
  switching their own UI.
- Currency/date formatting (`toLocaleString`) switches locale tag per selected language
  (`en-BE`/`fr-BE`/`nl-BE`) instead of the current hardcoded `fr-BE`

---

## Capabilities

1. Electrician can use the entire app in English, French, or Dutch
2. Electrician can send any individual quote to a customer in a different language than their
   own UI language, via a per-quote language picker
3. Currency and date formatting match the selected language's Belgian convention
4. Future features add new strings through the message dictionaries rather than hardcoding text

---

## Out of Scope (v1)

- Languages beyond English/French/Dutch
- Auto-detecting a customer's preferred language
- Translating third-party error messages (Supabase, etc.) — only app-authored strings
- Retroactively translating the `docs/ai-assistant.md` spec or other internal docs

---

## Impact

| File | Change |
|------|--------|
| `package.json` | New dep: `next-intl` |
| `next.config.ts` | next-intl plugin wiring |
| `src/middleware.ts` | Compose locale routing with existing Supabase session-refresh middleware |
| `messages/en.json`, `messages/fr.json`, `messages/nl.json` | New — translation dictionaries |
| `src/app/[locale]/...` | Route restructure — every existing route moves under a `[locale]` segment |
| `src/components/NavBar.tsx` | Language switcher |
| Every component with user-facing text | Strings replaced with `useTranslations()` keys |
| `supabase/migrations/00X_quote_language.sql` | New — `language` column on `projects` |
| `src/components/quote/QuotePreview.tsx`, `QuotePdfDocument.tsx` | Locale-aware currency/date formatting, per-quote language keying |

**Depends on:** `professional-quote-pdf` (for `QuotePdfDocument.tsx` to localize) — recommend
shipping that proposal first.
