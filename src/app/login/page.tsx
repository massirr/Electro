"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user, loading, requestOTP } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestOTP(email.trim());
      setSent(true);
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setError(msg && msg !== "{}" ? msg : "Failed to send link. Please try again.");
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
          {!sent ? (
            <form onSubmit={handleSend} className="space-y-4">
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
              {callbackError && (
                <p className="text-xs text-[var(--error)]">Sign-in failed: {callbackError}</p>
              )}
              {error && <p className="text-xs text-[var(--error)]">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-sm font-medium py-3 rounded-md bg-[var(--accent)] text-white hover:opacity-90 active:opacity-75 disabled:opacity-50 transition-opacity min-h-[44px]"
              >
                {submitting ? "Sending…" : "Send sign-in link"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[var(--ink)]">
                Check your inbox — we sent a sign-in link to{" "}
                <span className="font-medium">{email}</span>.
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                Click the link in the email to sign in. It expires in 1 hour.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(""); setError(null); }}
                className="w-full text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] py-1 transition-colors"
              >
                ← Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-[var(--ink-tertiary)] mt-4">
          No password needed — sign in with your email.
        </p>
      </div>
    </div>
  );
}
