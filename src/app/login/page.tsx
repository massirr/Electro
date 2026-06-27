"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!name.trim()) { setError("Name required"); return; }
        await register(email, password, name.trim());
      }
      router.push("/");
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "Authentication failed";
      setError(msg.includes("Failed to fetch") ? "Cannot reach PocketBase — is it running?" : msg);
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
          <div className="flex gap-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 text-xs py-2 rounded border transition-colors ${
                  mode === m
                    ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                    : "border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-xs text-[var(--ink-muted)] mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Janssen"
                  autoComplete="name"
                  className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@electro.be"
                autoComplete="email"
                required
                className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
                className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
              />
            </div>

            {error && <p className="text-xs text-[var(--error)]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-sm font-medium py-3 rounded-md bg-[var(--accent)] text-white hover:opacity-90 active:opacity-75 disabled:opacity-50 transition-opacity min-h-[44px] mt-2"
            >
              {submitting ? "…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
