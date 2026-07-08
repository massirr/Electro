"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  companyName: string;
  btwNumber: string;
  hourlyRate: number;
  companyAddress: string;
  companyPhone: string;
  companyWebsite: string;
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
        .select("name, company_name, btw_number, hourly_rate, company_address, company_phone, company_website")
        .eq("id", supabaseUser.id)
        .single();
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        name: profile?.name ?? "",
        companyName: profile?.company_name ?? "",
        btwNumber: profile?.btw_number ?? "",
        hourlyRate: profile?.hourly_rate ?? 85,
        companyAddress: profile?.company_address ?? "",
        companyPhone: profile?.company_phone ?? "",
        companyWebsite: profile?.company_website ?? "",
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

  const updateProfile = useCallback(async (data: {
    name?: string;
    companyName?: string;
    btwNumber?: string;
    hourlyRate?: number;
    companyAddress?: string;
    companyPhone?: string;
    companyWebsite?: string;
  }) => {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) throw new Error("Not authenticated");
    const { error } = await supabase.from("profiles").update({
      name: data.name,
      company_name: data.companyName,
      btw_number: data.btwNumber,
      hourly_rate: data.hourlyRate,
      company_address: data.companyAddress,
      company_phone: data.companyPhone,
      company_website: data.companyWebsite,
      updated_at: new Date().toISOString(),
    }).eq("id", u.id);
    if (error) throw error;
    setUser(prev => prev ? {
      ...prev,
      ...data,
      companyName: data.companyName ?? prev.companyName,
      btwNumber: data.btwNumber ?? prev.btwNumber,
      companyAddress: data.companyAddress ?? prev.companyAddress,
      companyPhone: data.companyPhone ?? prev.companyPhone,
      companyWebsite: data.companyWebsite ?? prev.companyWebsite,
    } : null);
  }, []);

  return { user, loading, requestOTP, logout, updateProfile };
}
