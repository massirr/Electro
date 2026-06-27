"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TakeoffForm } from "@/components/takeoff/TakeoffForm";
import { QuotesList } from "@/components/quotes/QuotesList";
import { useAuth } from "@/hooks/useAuth";
import type { JobType } from "@/domain/types";

interface LoadTarget {
  project: {
    name: string;
    jobType: JobType;
    hourlyRate: number;
    marginPercent: number;
    customerName?: string;
    customerEmail?: string;
    customerAddress?: string;
  };
  items: Array<{
    externalItemId: string;
    name: string;
    quantity: number;
    hoursPerUnit: number;
  }>;
}

export default function QuotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadTarget, setLoadTarget] = useState<LoadTarget | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const handleLoad = useCallback(async (id: string) => {
    const res = await fetch(`/api/quotes/${id}`);
    if (!res.ok) return;
    const data: LoadTarget = await res.json();
    setLoadTarget(data);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading || !user) {
    return <div className="min-h-screen" style={{ background: "var(--canvas)" }} />;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header
        className="mb-6 sm:mb-10 pl-4 no-print"
        style={{ borderLeft: "2px solid var(--accent)" }}
      >
        <h1
          className="font-semibold text-[var(--ink)]"
          style={{ fontSize: "clamp(24px, 6vw, 36px)", lineHeight: 1.1, letterSpacing: "-0.8px" }}
        >
          Electro
        </h1>
        <p className="text-sm text-[var(--ink-muted)] mt-1">Quote builder</p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-start">
        <aside className="w-full md:w-60 md:shrink-0 no-print">
          <QuotesList
            refreshKey={refreshKey}
            onLoad={handleLoad}
            onDelete={handleDelete}
            userId={user.id}
          />
        </aside>
        <div className="flex-1 min-w-0">
          <TakeoffForm
            loadTarget={loadTarget}
            onSaved={handleSaved}
            userId={user.id}
            initialHourlyRate={user.hourlyRate ?? 85}
            electricianName={user.name}
            electricianBtw={user.btwNumber}
          />
        </div>
      </div>
    </main>
  );
}
