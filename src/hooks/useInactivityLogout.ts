"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

const TIMEOUT_MS = 60 * 60 * 1000; // 1 hour of real inactivity
const CHECK_INTERVAL_MS = 30 * 1000; // re-check every 30s while the tab runs
const PERSIST_THROTTLE_MS = 5 * 1000; // cap writes from mousemove/scroll
const STORAGE_KEY = "electro-last-active";

type Stored = { id: string; t: number };

// The stored timestamp is tagged with the user id so a deadline left behind by
// a different account on a shared device can never carry over.
function readStored(userId: string): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.id !== userId || typeof parsed?.t !== "number") return null;
    return parsed.t;
  } catch {
    return null;
  }
}

function writeStored(userId: string, t: number) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: userId, t })); } catch {}
}

function clearStored() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function useInactivityLogout() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const lastActiveRef = useRef(Date.now());
  const lastPersistedRef = useRef(0);
  const loggedOutRef = useRef(false);

  // Depend on the id, not the user object. useAuth rebuilds a fresh user object
  // on every Supabase auth event — including TOKEN_REFRESHED (~90s before the
  // JWT expires) and the SIGNED_IN that fires on tab focus — so depending on the
  // object re-ran this effect and reset the idle clock before the timeout could
  // ever be reached.
  const userId = user?.id ?? null;

  // Drop the deadline once we know the user is signed out, so the next login
  // does not resume a stale timestamp. Guarded on `loading` because useAuth
  // reports a null user while it is still resolving the session on page load.
  useEffect(() => {
    if (loading || userId) return;
    clearStored();
  }, [loading, userId]);

  useEffect(() => {
    if (!userId) return;
    const uid = userId;
    loggedOutRef.current = false;

    // Resume the stored deadline instead of granting a fresh hour — a reload
    // must not extend the session.
    const stored = readStored(uid);
    lastActiveRef.current = stored ?? Date.now();
    lastPersistedRef.current = lastActiveRef.current;
    if (stored === null) writeStored(uid, lastActiveRef.current);

    async function signOutIdle() {
      loggedOutRef.current = true;
      clearStored();
      await logout();
      router.push("/login");
    }

    // Compare against Date.now() (real wall-clock time) rather than counting down a
    // setTimeout — so this stays correct across device sleep and frozen/discarded
    // background tabs, which pause timers but not the clock.
    function check() {
      if (loggedOutRef.current) return;
      if (Date.now() - lastActiveRef.current >= TIMEOUT_MS) void signOutIdle();
    }

    const bump = () => {
      if (loggedOutRef.current) return;
      const now = Date.now();
      lastActiveRef.current = now;
      // mousemove/scroll fire continuously; only touch storage occasionally.
      if (now - lastPersistedRef.current >= PERSIST_THROTTLE_MS) {
        lastPersistedRef.current = now;
        writeStored(uid, now);
      }
    };

    // Activity in another tab keeps this one alive; take whichever is newer.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as Stored;
        if (parsed?.id !== uid || typeof parsed?.t !== "number") return;
        if (parsed.t > lastActiveRef.current) lastActiveRef.current = parsed.t;
      } catch {}
    };

    const activity = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    activity.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    // Interval covers a focused-but-idle tab; visibility/focus fire the check the
    // moment the tab wakes from sleep or the user switches back to it.
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("storage", onStorage);

    // A session that is already past its deadline on load ends immediately.
    check();

    return () => {
      activity.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [userId, logout, router]);
}
