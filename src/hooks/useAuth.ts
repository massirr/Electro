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
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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

  return { user, loading, requestOTP, logout, updateProfile };
}
