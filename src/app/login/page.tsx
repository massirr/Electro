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
  const [otpId, setOtpId] = useState("");
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
      const { otpId: id } = await requestOTP(email.trim());
      setOtpId(id);
      setStep("code");
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "Failed to send code";
      setError(msg.includes("Failed to fetch") ? "Cannot reach PocketBase — is it running?" : msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authWithOTP(otpId, code.trim());
      router.push("/");
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "Invalid code";
      setError(msg.includes("Failed to fetch") ? "Cannot reach PocketBase — is it running?" : "Invalid or expired code. Try again.");
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
