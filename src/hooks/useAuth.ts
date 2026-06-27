"use client";

import { useState, useEffect, useCallback } from "react";
import { getPbClient } from "@/lib/pb-client";
import type { RecordModel } from "pocketbase";

export interface AuthUser extends RecordModel {
  email: string;
  name: string;
  btwNumber?: string;
  hourlyRate?: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPbClient();
    setUser(pb.authStore.model ? (pb.authStore.model as AuthUser) : null);
    setLoading(false);

    const unsub = pb.authStore.onChange((_token, model) => {
      setUser(model ? (model as AuthUser) : null);
    });
    return () => { unsub(); };
  }, []);

  const requestOTP = useCallback(async (email: string): Promise<{ otpId: string }> => {
    const pb = getPbClient();
    return pb.collection("users").requestOTP(email);
  }, []);

  const authWithOTP = useCallback(async (otpId: string, code: string): Promise<void> => {
    const pb = getPbClient();
    await pb.collection("users").authWithOTP(otpId, code);
  }, []);

  const logout = useCallback(() => {
    getPbClient().authStore.clear();
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; btwNumber?: string; hourlyRate?: number }) => {
    const pb = getPbClient();
    if (!pb.authStore.model?.id) throw new Error("Not authenticated");
    const updated = await pb.collection("users").update(pb.authStore.model.id, data);
    pb.authStore.save(pb.authStore.token, updated);
    return updated as AuthUser;
  }, []);

  return { user, loading, requestOTP, authWithOTP, logout, updateProfile };
}
