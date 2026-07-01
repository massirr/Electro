"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [btwNumber, setBtwNumber] = useState("");
  const [hourlyRate, setHourlyRate] = useState("85");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (user) {
      setName(user.name ?? "");
      setBtwNumber(user.btwNumber ?? "");
      setHourlyRate(String(user.hourlyRate ?? 85));
    }
  }, [user, loading, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile({
        name: name.trim(),
        btwNumber: btwNumber.trim(),
        hourlyRate: parseFloat(hourlyRate) || 85,
      });
      setSaved(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (loading || !user) return null;

  return (
    <>
      <main className="max-w-lg mx-auto px-4 py-10">
        <header className="mb-8 pl-4" style={{ borderLeft: "2px solid var(--accent)" }}>
          <h1 className="font-semibold text-[var(--ink)]" style={{ fontSize: "24px", letterSpacing: "-0.4px" }}>
            Profile
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1">{user.email}</p>
        </header>

        <div className="rounded-lg p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)" }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false); }}
                placeholder="Jan Janssen"
                className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">BTW nummer</label>
              <input
                type="text"
                value={btwNumber}
                onChange={(e) => { setBtwNumber(e.target.value); setSaved(false); }}
                placeholder="BE 0123.456.789"
                className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Hourly rate (€/hr)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => { setHourlyRate(e.target.value); setSaved(false); }}
                placeholder="85"
                className="w-full text-sm px-3 py-2 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--ink)] placeholder:text-[var(--ink-subtle)] [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
              />
            </div>

            {error && <p className="text-xs text-[var(--error)]">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="text-sm font-medium px-5 py-2 rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px]"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {saved && <span className="text-xs text-[#4caf75]">Saved</span>}
            </div>
          </form>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 text-sm text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors"
        >
          Sign out
        </button>
      </main>
    </>
  );
}
