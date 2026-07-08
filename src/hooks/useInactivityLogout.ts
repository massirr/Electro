"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

const TIMEOUT_MS = 60 * 60 * 1000; // 1 hour of real inactivity
const CHECK_INTERVAL_MS = 30 * 1000; // re-check every 30s while the tab runs

export function useInactivityLogout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const lastActiveRef = useRef(Date.now());
  const loggedOutRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    lastActiveRef.current = Date.now();
    loggedOutRef.current = false;

    const bump = () => { lastActiveRef.current = Date.now(); };

    // Compare against Date.now() (real wall-clock time) rather than counting down a
    // setTimeout — so this stays correct across device sleep and frozen/discarded
    // background tabs, which pause timers but not the clock.
    async function check() {
      if (loggedOutRef.current) return;
      if (Date.now() - lastActiveRef.current >= TIMEOUT_MS) {
        loggedOutRef.current = true;
        await logout();
        router.push("/login");
      }
    }

    const activity = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    activity.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    // Interval covers a focused-but-idle tab; visibility/focus fire the check the
    // moment the tab wakes from sleep or the user switches back to it.
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    const interval = setInterval(() => void check(), CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      activity.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(interval);
    };
  }, [user, logout, router]);
}
