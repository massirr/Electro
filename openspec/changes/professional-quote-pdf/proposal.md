# OpenSpec — Professional PDF Quotes + Email Delivery

**Status:** Draft
**Date:** 2026-07-04
**Author:** massirr

---

## Why

Customers expect an offerte that looks like a professional business document — full company
letterhead, a quote reference/validity/delivery-date block, and signature lines for both parties
(see reference: a standard Dutch/Belgian "OFFERTE" template). Today Electro's "PDF" is just the
on-screen `QuotePreview` rendered through the browser's print dialog — it has none of the
letterhead, metadata, or signature blocks, and the electrician still has to manually attach the
printed file to an email themselves.

This proposal covers two things that should ship together: (1) a real branded quote template,
and (2) optionally having the app email that quote directly to the customer as a PDF attachment.
**Emailing is an add-on, not a requirement** — the electrician must always be able to download the
same branded PDF and send it themselves however they like (their own email client, WhatsApp,
etc.), with zero dependency on Resend being configured.

---

## Research: is this feasible, and with what?

**No third-party "PDF API" is required.** Two options were evaluated:

| Approach | Verdict |
|---|---|
| Puppeteer/Playwright (headless Chromium → PDF) | Rejected. Heaviest option on Vercel serverless (cold starts, needs `@sparticuz/chromium`), and this project just spent 5 commits fighting a bun-vs-Vercel subpath resolution issue with `@vercel/analytics` — a Chromium binary dependency is the same risk class, worse. |
| Third-party PDF SaaS (DocRaptor, PDFShift, Browserless) | Rejected. Recurring cost and sends customer PII (name, address) to another vendor for a solo-electrician, low-volume app — not worth it. |
| **`@react-pdf/renderer`** | **Recommended.** Pure JS/React, no headless browser, renders reliably in a Vercel serverless function, MIT license, no external network call. |

For emailing: Supabase's built-in email (used today for auth) **cannot** send arbitrary
transactional email to customer addresses — it's scoped to auth flows only, which is exactly why
the earlier Resend SMTP attempt (2026-07-01 session) was blocked in sandbox mode (can only send to
the account owner without a verified sending domain). This feature is the reason to finally
complete that one-time Resend domain verification for `irakozedarlo.be`. At this app's volume,
Resend's free tier (3,000 emails/month) covers it — no paid plan needed.

**Resend is one platform-level account, not per-electrician.** `irakozedarlo.be` is verified once,
by whoever runs this deployment — individual electricians never sign up for Resend, never see an
API key, never touch DNS. Every electrician's outbound quote email still technically sends *from*
`quotes@irakozedarlo.be` (that's a hard Resend requirement — you can only send from a domain you've
verified), but the customer sees the electrician's own business identity via:
- **From display name:** the electrician's company name, e.g. `"Hugues Elektriciteit" <quotes@irakozedarlo.be>`
- **Reply-To:** the electrician's own account email — so a reply goes straight to them, not to the platform

This is the same "send on behalf of" pattern used by Calendly, Stripe invoices, etc. No electrician
needs their own domain for this to feel like it came from their business.

**No Supabase Storage is needed.** The PDF is generated in-memory in the API route and attached
directly to the outbound email as a buffer; nothing is persisted unless a "download my sent
quotes again" feature is requested later (not in this proposal).

---

## What Changes

### Data layer
- `profiles`: add `company_address`, `company_phone`, `company_website` (text letterhead fields —
  logo upload explicitly out of scope, see below)
- `projects`: add `quote_reference` (auto-generated, e.g. `Q-2026-0042`), `validity_days`
  (default 30), `delivery_date` (nullable), `customer_reference` (optional free text, "uw
  referentie"), `sent_at` (nullable timestamp, set when the email successfully sends)

### PDF template
- New `src/components/quote/QuotePdfDocument.tsx` built with `@react-pdf/renderer`, separate from
  the on-screen `QuotePreview`. Mirrors the reference layout:
  - Letterhead: company name/address/phone/website/BTW number, top-aligned like the reference
  - "AAN" block: customer name/address
  - Metadata block: date, offerte reference, validity (days), delivery date, "uw referentie"
  - Line items table: Product / Artikelnummer / Aantal / Tarief / BTW / Bedrag
  - Subtotal / VAT / Grand Total block (same margin-included, cost-hidden totals as today —
    no supplier cost prices, per the existing Hugues hide-cost-pdf decision)
  - Two signature blocks: "Voor akkoord opdrachtgever" / "Voor akkoord opdrachtnemer", each with
    date/place/name/signature lines — **static print layout only, no e-signature capture**

### PDF delivery: download (always available) + email (optional)
Both paths render the exact same `QuotePdfDocument` through one shared server-side generator
function, so the downloaded file and the emailed attachment are always identical.

- New `GET /api/quotes/[id]/pdf` — renders `QuotePdfDocument` to a PDF buffer and returns it as a
  file download (`Content-Disposition: attachment`). **No Resend dependency** — works even if
  email sending is never configured. This is the primary "give this to the customer" action.
- New `POST /api/quotes/[id]/send` — same generator, emails the buffer via Resend to
  `customer_email` as an attachment (From display name = electrician's company name, Reply-To =
  electrician's account email, per the Resend section above), sets `sent_at` on success. Purely
  optional convenience on top of the download.
- Quote view gets two buttons: **"Download PDF"** (always shown) and **"Email to customer"**
  (shown only if `RESEND_API_KEY` is configured on the deployment; shows sent/delivered state once
  `sent_at` is set)
- Existing browser `window.print()` path stays for the electrician's own on-screen
  preview/calculation review — it isn't the customer-facing artifact anymore, `QuotePdfDocument`
  (via the Download/Email buttons) is

### Env / config
- `RESEND_API_KEY` env var
- Verify `irakozedarlo.be` at resend.com/domains (one-time DNS setup, blocking prerequisite)

---

## Capabilities

1. Electrician can download a professional, branded PDF quote at any time — this always works,
   with no Resend/email configuration required, and is theirs to send however they choose
2. Electrician can *optionally* have the app email that same PDF directly to the customer, if
   Resend is configured on the deployment
3. PDF includes full company letterhead, quote reference, validity period, delivery date, and
   customer reference, matching Belgian offerte conventions
4. PDF includes signature blocks for both parties for physical sign-off
5. Client-facing PDF still hides supplier cost prices (existing behavior preserved)
6. Electrician can still use the browser print for their own on-screen review as before

---

## Out of Scope (v1)

- Logo upload — text-only letterhead per the reviewed decision (adds a Supabase Storage bucket +
  upload/resize flow; can be a follow-up proposal if the electrician asks for it)
- E-signature capture / digital acceptance — signature blocks are static print lines only
- Automatic reminder emails or quote-expiration notifications
- Multi-language quote content — tracked in the separate `multilingual-app` proposal. This
  template's copy should be written as translation keys (not hardcoded strings) so that proposal
  can slot in without re-touching the PDF layout.
- Separate `contact_email` field for Reply-To — v1 reuses the electrician's existing account
  login email as Reply-To. A dedicated business-contact-email field (if the login email is
  personal and different from the one customers should reply to) can be a follow-up if needed.
- Per-electrician custom sending domains (true white-label "from your own domain@") — would
  require each electrician to verify their own domain with Resend; real onboarding burden, not
  needed unless deliverability/branding complaints come up

---

## Impact

| File | Change |
|------|--------|
| `supabase/migrations/004_quote_metadata.sql` | New — letterhead fields on `profiles`, quote metadata fields on `projects` |
| `package.json` | New deps: `@react-pdf/renderer`, `resend` |
| `src/components/quote/QuotePdfDocument.tsx` | New — react-pdf branded template |
| `src/lib/quotePdf.ts` | New — shared PDF-buffer generator used by both routes below |
| `src/app/api/quotes/[id]/pdf/route.ts` | New — download the PDF, no Resend dependency |
| `src/app/api/quotes/[id]/send/route.ts` | New — same PDF, email via Resend (From display name + Reply-To per electrician), set `sent_at` |
| `src/app/profile/page.tsx` | Add company address/phone/website fields |
| `src/components/quote/QuotePreview.tsx` | Add "Download PDF" (always) + "Email to customer" (conditional on Resend config) buttons |
| Env (Vercel) | `RESEND_API_KEY` (optional — download path works without it) |
