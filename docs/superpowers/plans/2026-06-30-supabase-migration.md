# Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PocketBase with Supabase for auth, database, and email — then deploy to Vercel.

**Architecture:** Supabase handles auth (OTP via email), Postgres (projects + takeoff_items + profiles), and SMTP. Next.js API routes use the Supabase server client via `@supabase/ssr`. The browser uses the Supabase browser client. A `middleware.ts` refreshes sessions on every request.

**Tech Stack:** `@supabase/supabase-js`, `@supabase/ssr`, Next.js 15 App Router, Vercel

## Global Constraints

- Package manager: **Bun** — always `bun add`, never `npm install`
- Never commit `.env.local` — it's gitignored
- Keep `src/domain/`, `src/io/`, `src/app/api/catalog/`, `src/app/api/quote/` untouched — they have no PocketBase dependency
- camelCase in TS code, snake_case in SQL
- All Supabase env vars must be prefixed `NEXT_PUBLIC_` for browser access (anon key + URL) or unprefixed for server-only (service role key)

---

## File Map

| Action | File | What it does |
|--------|------|-------------|
| **Create** | `supabase/migrations/001_schema.sql` | Full Postgres schema + RLS policies |
| **Create** | `src/lib/supabase/client.ts` | Browser Supabase client (singleton) |
| **Create** | `src/lib/supabase/server.ts` | Server Supabase client (per-request, uses cookies) |
| **Create** | `src/middleware.ts` | Refreshes Supabase session on every request |
| **Rewrite** | `src/hooks/useAuth.ts` | Swap PB authStore → Supabase session |
| **Rewrite** | `src/app/login/page.tsx` | Swap `requestOTP/authWithOTP` → `signInWithOtp/verifyOtp` |
| **Rewrite** | `src/app/api/quotes/route.ts` | Swap `pb.collection` → `supabase.from` |
| **Rewrite** | `src/app/api/quotes/[id]/route.ts` | Swap `pb.collection` → `supabase.from` |
| **Rewrite** | `src/app/profile/page.tsx` | Swap `updateProfile` to hit `profiles` table |
| **Rewrite** | `scripts/seed-pocketbase.ts` → `scripts/seed-supabase.ts` | Seed products/kits via Supabase |
| **Delete** | `src/lib/pb.ts`, `src/lib/pb-client.ts`, `src/io/pocketbase-admin.ts` | PocketBase clients — gone |
| **Delete** | `infra/pocketbase/` | Binary + migrations — gone |
| **Update** | `package.json` | Remove `pocketbase`, add `@supabase/supabase-js @supabase/ssr` |
| **Update** | `.env.local` | Add Supabase vars, remove PB vars |
| **Update** | `CLAUDE.md`, `HANDOVER.md` | Remove PB references |

---

## Task 1: Install packages + env vars

**⛔ BLOCKED on user input:** Need Supabase project URL, anon key, service_role key before this task can run.

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

- [ ] **Step 1: Remove pocketbase, add Supabase packages**

```bash
cd /Volumes/Koze_disk/Projects/Projects-Fun/Electro
bun remove pocketbase
bun add @supabase/supabase-js @supabase/ssr
```

Expected: `node_modules/pocketbase` gone, `node_modules/@supabase` present.

- [ ] **Step 2: Update `.env.local` with Supabase vars**

Replace the full content of `.env.local` with:

```
# Supabase — public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Supabase — server only (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Mailpit (local dev only — not needed once Supabase email is configured)
MAILPIT_SMTP_PORT=1025
MAILPIT_UI_PORT=8025

# PocketBase admin (keep temporarily until migration confirmed working)
PB_ADMIN_EMAIL=admin@electro.local
PB_ADMIN_PASSWORD=electro1234
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
bun run build 2>&1 | head -20
```

Expected: errors about missing `pocketbase` imports (expected — we haven't rewritten yet). No Bun/Supabase install errors.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock .env.local
git commit -m "chore: swap pocketbase for @supabase/supabase-js + @supabase/ssr"
```

---

## Task 2: Supabase schema

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] **Step 1: Create migration file**

```bash
mkdir -p /Volumes/Koze_disk/Projects/Projects-Fun/Electro/supabase/migrations
```

Create `supabase/migrations/001_schema.sql`:

```sql
-- profiles: extends auth.users with electrician-specific fields
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  btw_number TEXT NOT NULL DEFAULT '',
  hourly_rate NUMERIC NOT NULL DEFAULT 85,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row when a new auth user signs in for the first time
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- projects
CREATE TABLE projects (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner            UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  project_date     DATE,
  hourly_rate      NUMERIC NOT NULL,
  margin_percent   NUMERIC NOT NULL,
  job_type         TEXT NOT NULL CHECK (job_type IN ('renovation', 'new-build')),
  grand_total      NUMERIC NOT NULL DEFAULT 0,
  customer_name    TEXT NOT NULL DEFAULT '',
  customer_email   TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- takeoff_items (cascade-delete when project is deleted)
CREATE TABLE takeoff_items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  external_item_id TEXT NOT NULL,
  name             TEXT NOT NULL,
  quantity         NUMERIC NOT NULL,
  hours_per_unit   NUMERIC NOT NULL
);

-- Row Level Security: users only see/modify their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile"
  ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_own_projects"
  ON projects FOR ALL USING (auth.uid() = owner) WITH CHECK (auth.uid() = owner);

CREATE POLICY "users_own_takeoff_items"
  ON takeoff_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_id AND projects.owner = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_id AND projects.owner = auth.uid()
  ));
```

- [ ] **Step 2: Run migration in Supabase Dashboard**

Go to **Supabase Dashboard → SQL Editor**, paste the full contents of `supabase/migrations/001_schema.sql`, click Run.

Expected: no errors. Tables `profiles`, `projects`, `takeoff_items` appear in **Table Editor**.

- [ ] **Step 3: Enable email OTP in Supabase Dashboard**

Go to **Authentication → Providers → Email**:
- Enable email provider: ✅
- Confirm email: ✅ (or off for dev — up to you)
- Secure email change: ✅
- OTP expiry: 3600 (1 hour)

Go to **Authentication → Email Templates** and verify the OTP template is present (default is fine).

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: supabase schema — profiles, projects, takeoff_items + RLS"
```

---

## Task 3: Supabase client files + middleware

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/middleware.ts`
- Delete: `src/lib/pb.ts`, `src/lib/pb-client.ts`

- [ ] **Step 1: Create browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {} // called from Server Component — safe to ignore
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create middleware for session refresh**

Create `src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to /login (except the login page itself and API routes)
  if (!user && !request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 4: Delete PocketBase client files**

```bash
rm /Volumes/Koze_disk/Projects/Projects-Fun/Electro/src/lib/pb.ts
rm /Volumes/Koze_disk/Projects/Projects-Fun/Electro/src/lib/pb-client.ts
rm /Volumes/Koze_disk/Projects/Projects-Fun/Electro/src/io/pocketbase-admin.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git rm src/lib/pb.ts src/lib/pb-client.ts src/io/pocketbase-admin.ts
git commit -m "feat: supabase client + middleware, remove pocketbase clients"
```

---

## Task 4: Auth hook + login page

**Files:**
- Rewrite: `src/hooks/useAuth.ts`
- Rewrite: `src/app/login/page.tsx`

- [ ] **Step 1: Rewrite `useAuth.ts`**

Replace the full content of `src/hooks/useAuth.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  btwNumber: string;
  hourlyRate: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(supabaseUser: User | null) {
      if (!supabaseUser) { setUser(null); setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, btw_number, hourly_rate")
        .eq("id", supabaseUser.id)
        .single();
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        name: profile?.name ?? "",
        btwNumber: profile?.btw_number ?? "",
        hourlyRate: profile?.hourly_rate ?? 85,
      });
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data: { user: u } }) => loadUser(u));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const requestOTP = useCallback(async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw error;
  }, []);

  const authWithOTP = useCallback(async (email: string, token: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; btwNumber?: string; hourlyRate?: number }) => {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) throw new Error("Not authenticated");
    const { error } = await supabase.from("profiles").update({
      name: data.name,
      btw_number: data.btwNumber,
      hourly_rate: data.hourlyRate,
      updated_at: new Date().toISOString(),
    }).eq("id", u.id);
    if (error) throw error;
    setUser(prev => prev ? { ...prev, ...data, btwNumber: data.btwNumber ?? prev.btwNumber } : null);
  }, []);

  return { user, loading, requestOTP, authWithOTP, logout, updateProfile };
}
```

- [ ] **Step 2: Rewrite `login/page.tsx`**

The key change: `requestOTP` no longer returns an `otpId` — Supabase ties verification to `email` directly. The state machine shrinks: `email` → `code` with email stored in state.

Replace the full content of `src/app/login/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Step = "email" | "code";

export default function LoginPage() {
  const { user, loading, requestOTP, authWithOTP } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestOTP(email.trim());
      setStep("code");
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "Failed to send code";
      setError(msg.includes("not found") ? "No account with that email." : msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authWithOTP(email.trim(), code.trim());
      router.push("/");
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "Invalid code";
      setError(msg.includes("expired") || msg.includes("invalid") ? "Invalid or expired code. Try again." : msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--canvas)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 pl-4" style={{ borderLeft: "2px solid var(--accent)" }}>
          <h1 className="font-semibold text-[var(--ink)]" style={{ fontSize: "28px", letterSpacing: "-0.6px" }}>
            Electro
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1">Electrical quoting tool</p>
        </div>

        <div className="rounded-lg p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)" }}>
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--ink-muted)] mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan@electro.be"
                  autoComplete="email"
                  autoFocus
                  required
                  className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
                />
              </div>
              {error && <p className="text-xs text-[var(--error)]">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-sm font-medium py-3 rounded-md bg-[var(--accent)] text-white hover:opacity-90 active:opacity-75 disabled:opacity-50 transition-opacity min-h-[44px]"
              >
                {submitting ? "Sending…" : "Send sign-in code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <p className="text-xs text-[var(--ink-muted)] mb-3">
                  Code sent to <span className="text-[var(--ink)]">{email}</span>
                </p>
                <label className="block text-xs text-[var(--ink-muted)] mb-1">Sign-in code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={8}
                  required
                  className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)] tracking-widest"
                />
              </div>
              {error && <p className="text-xs text-[var(--error)]">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-sm font-medium py-3 rounded-md bg-[var(--accent)] text-white hover:opacity-90 active:opacity-75 disabled:opacity-50 transition-opacity min-h-[44px]"
              >
                {submitting ? "Verifying…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setCode(""); setError(null); }}
                className="w-full text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] py-1 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-center text-[var(--ink-tertiary)] mt-4">
          No password needed — sign in with your email.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts src/app/login/page.tsx
git commit -m "feat: swap auth to supabase OTP (signInWithOtp + verifyOtp)"
```

---

## Task 5: API routes

**Files:**
- Rewrite: `src/app/api/quotes/route.ts`
- Rewrite: `src/app/api/quotes/[id]/route.ts`

Note: `src/app/api/catalog/route.ts` and `src/app/api/quote/route.ts` are **unchanged**.

- [ ] **Step 1: Rewrite `GET/POST /api/quotes`**

Replace full content of `src/app/api/quotes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { JobType, TakeoffItem } from "@/domain/types";
import { buildQuote } from "@/domain/calculators";
import { resolve } from "path";
import { loadCatalog } from "@/io/load-catalog";
import { loadKits } from "@/io/load-kits";

const DATA = resolve(process.cwd(), "data/sample-inputs");

let _cache: Promise<[Awaited<ReturnType<typeof loadCatalog>>, Awaited<ReturnType<typeof loadKits>>]> | null = null;
function getDataCache() {
  if (!_cache) {
    _cache = Promise.all([
      loadCatalog(`${DATA}/sample-catalog.csv`),
      loadKits(`${DATA}/sample-kits.json`),
    ]).catch((e) => { _cache = null; throw e; });
  }
  return _cache;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, project_date, grand_total, created_at")
    .eq("owner", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/quotes]", error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Map snake_case → camelCase to keep frontend unchanged
  return NextResponse.json(data.map(r => ({
    id: r.id,
    name: r.name,
    projectDate: r.project_date,
    grandTotal: r.grand_total,
    created: r.created_at,
  })));
}

interface SaveBody {
  name?: string;
  jobType?: JobType;
  hourlyRate?: number;
  marginPercent?: number;
  rows?: TakeoffItem[];
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: SaveBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { name, jobType, hourlyRate, marginPercent, rows, customerName, customerEmail, customerAddress } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  if (!jobType || (jobType !== "renovation" && jobType !== "new-build"))
    return NextResponse.json({ error: "jobType must be renovation or new-build" }, { status: 400 });
  if (!hourlyRate || !marginPercent || !Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "hourlyRate, marginPercent, and rows are required" }, { status: 400 });

  try {
    const [catalog, kits] = await getDataCache();
    const quote = buildQuote(rows, kits, catalog, { hourlyRate, jobType, marginPercent });

    const { data: project, error: projError } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        project_date: new Date().toISOString().slice(0, 10),
        job_type: jobType,
        hourly_rate: hourlyRate,
        margin_percent: marginPercent,
        grand_total: quote.grandTotal,
        owner: user.id,
        customer_name: customerName ?? "",
        customer_email: customerEmail ?? "",
        customer_address: customerAddress ?? "",
      })
      .select("id, name")
      .single();

    if (projError || !project) {
      console.error("[POST /api/quotes] project insert", projError);
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { error: itemsError } = await supabase.from("takeoff_items").insert(
      rows.map(row => ({
        project_id: project.id,
        external_item_id: row.id,
        name: row.name,
        quantity: row.quantity,
        hours_per_unit: row.hoursPerUnit,
      }))
    );

    if (itemsError) {
      console.error("[POST /api/quotes] items insert", itemsError);
      // Project was created — clean up to avoid orphans
      await supabase.from("projects").delete().eq("id", project.id);
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    return NextResponse.json({ id: project.id, name: project.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotes]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 2: Rewrite `GET/DELETE /api/quotes/[id]`**

Replace full content of `src/app/api/quotes/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner", user.id)
    .single();

  if (projError || !project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: items, error: itemsError } = await supabase
    .from("takeoff_items")
    .select("*")
    .eq("project_id", id);

  if (itemsError) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Map snake_case → camelCase for frontend compatibility
  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      projectDate: project.project_date,
      jobType: project.job_type,
      hourlyRate: project.hourly_rate,
      marginPercent: project.margin_percent,
      grandTotal: project.grand_total,
      customerName: project.customer_name,
      customerEmail: project.customer_email,
      customerAddress: project.customer_address,
      owner: project.owner,
      created: project.created_at,
    },
    items: items.map(i => ({
      id: i.external_item_id,
      name: i.name,
      quantity: i.quantity,
      hoursPerUnit: i.hours_per_unit,
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS ensures user can only delete their own projects
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("owner", user.id);
  if (error) return NextResponse.json({ error: "Not found or service unavailable" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: Verify build**

```bash
bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors related to the rewritten routes.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/quotes/
git commit -m "feat: quotes API routes — swap pocketbase for supabase"
```

---

## Task 6: Profile page

**Files:**
- Rewrite: `src/app/profile/page.tsx`

The profile page calls `updateProfile` from `useAuth` — that hook already maps to Supabase in Task 4. The only change needed is removing `user.name`/`user.btwNumber`/`user.hourlyRate` type references that came from PocketBase's `RecordModel`. Since `AuthUser` in the new hook already has these fields typed correctly, the page should mostly work. Double-check and fix any import of `RecordModel`.

- [ ] **Step 1: Remove PocketBase RecordModel reference**

Read the current file and remove any `import type { RecordModel } from "pocketbase"` or `extends RecordModel`. The new `AuthUser` type in `useAuth.ts` is a plain interface — no PocketBase dependency.

```bash
grep -n "pocketbase\|RecordModel" /Volumes/Koze_disk/Projects/Projects-Fun/Electro/src/app/profile/page.tsx
```

If any hits: remove those lines.

- [ ] **Step 2: Check all remaining files for pocketbase imports**

```bash
grep -rn "from \"pocketbase\"\|from 'pocketbase'\|pb-client\|lib/pb" \
  /Volumes/Koze_disk/Projects/Projects-Fun/Electro/src/
```

Fix any remaining references.

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/page.tsx
git commit -m "feat: profile page — remove pocketbase dependency"
```

---

## Task 7: Cleanup PocketBase artifacts

**Files:**
- Delete: `infra/pocketbase/`
- Delete: `scripts/seed-pocketbase.ts` (rename to seed-supabase.ts)

- [ ] **Step 1: Remove infra/pocketbase**

```bash
rm -rf /Volumes/Koze_disk/Projects/Projects-Fun/Electro/infra/pocketbase/pb_data
rm -rf /Volumes/Koze_disk/Projects/Projects-Fun/Electro/infra/pocketbase/pb_migrations
# Keep binary gitignored reference in case user wants to roll back — remove if confident
```

- [ ] **Step 2: Update CLAUDE.md — remove PocketBase references**

Remove any mention of PocketBase start commands, replace with Supabase instructions.

- [ ] **Step 3: Update HANDOVER.md**

Add a new session entry at the top documenting the migration.

- [ ] **Step 4: Update .gitignore — remove PocketBase entries**

Remove `infra/pocketbase/pocketbase` and `infra/pocketbase/pb_data/` from `.gitignore`, add `supabase/.temp/` if needed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove pocketbase artifacts, update docs"
```

---

## Task 8: Deploy to Vercel

**⛔ BLOCKED on user input:** Need Vercel project linked and user to confirm deploy.

- [ ] **Step 1: Install Vercel CLI if needed**

```bash
bunx vercel --version || bun add -g vercel
```

- [ ] **Step 2: Link project to Vercel**

```bash
bunx vercel link
```

Follow prompts: link to existing project or create new one named `electro`.

- [ ] **Step 3: Add environment variables to Vercel**

```bash
bunx vercel env add NEXT_PUBLIC_SUPABASE_URL production
bunx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
bunx vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

Paste the values when prompted.

- [ ] **Step 4: Deploy**

```bash
bunx vercel --prod
```

Expected: deployment URL printed, e.g. `https://electro.vercel.app`.

- [ ] **Step 5: Add production URL to Supabase**

In **Supabase Dashboard → Authentication → URL Configuration**:
- Site URL: `https://electro.vercel.app` (your actual Vercel URL)
- Add to Redirect URLs: `https://electro.vercel.app/**`

- [ ] **Step 6: Test production OTP flow**

1. Go to the production URL → /login
2. Enter your email → Send sign-in code
3. Check inbox for 6-digit code (real email this time, no Mailpit)
4. Enter code → should land on home page

- [ ] **Step 7: Final commit + tag**

```bash
git tag v1.0.0-supabase
git push origin main --tags
git commit -m "chore: supabase migration complete, deployed to vercel" --allow-empty
```

---

## Self-Review

**Spec coverage:**
- ✅ Auth: OTP via Supabase email
- ✅ User profiles: `profiles` table with btwNumber + hourlyRate
- ✅ Projects: CRUD with RLS (users only see own data)
- ✅ Takeoff items: cascade delete from project
- ✅ Session management: middleware refreshes on every request
- ✅ Deployment: Vercel + Supabase env vars
- ✅ Cleanup: PocketBase removed

**Untouched (correct):**
- `src/domain/` — pure logic
- `src/app/api/catalog/` — reads from JSON file
- `src/app/api/quote/` — pure calculation
- `src/io/` loaders
- All UI components except login page

**Blocking steps requiring user input:**
- Task 1: Supabase credentials (URL, anon key, service_role key)
- Task 2, Step 2: Run SQL in Supabase Dashboard (manual step)
- Task 2, Step 3: Enable email OTP in Supabase Dashboard (manual step)
- Task 8: Vercel deploy confirmation
