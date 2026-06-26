"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { QuoteResult, TakeoffItem } from "@/domain/types";

const SETTINGS = { hourlyRate: 85, jobType: "new-build" as const, marginPercent: 15 };
const DEBOUNCE_MS = 300;

export function useQuote(rows: TakeoffItem[]) {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchQuote = useCallback(async (takeoff: TakeoffItem[]) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ takeoff, settings: SETTINGS }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Quote API error: ${res.status}`);
      const data: QuoteResult = await res.json();
      setQuote(data);
      setError(null);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Failed to update — showing last valid quote");
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const active = rows.filter((r) => r.id !== "");
    if (active.length === 0) {
      setQuote(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoading(true);
    timerRef.current = setTimeout(() => fetchQuote(active), DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [rows, fetchQuote]);

  return { quote, isLoading, error };
}
