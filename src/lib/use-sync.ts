"use client";

import * as React from "react";
import { create } from "zustand";
import { getSupabase, isSyncConfigured, STATE_TABLE } from "./supabase";
import { useAppStore } from "./store";
import { mergeSlice, pickSyncSlice, type SyncSlice } from "./sync";

// ───────────────────────────────────────────────────────────
// Cloud sync engine (offline-first): pull → merge → push
// - local (zustand persist) เป็น source of truth เสมอ
// - ไม่ตั้ง env / ไม่ล็อกอิน → ไม่ทำอะไร (แอปทำงานออฟไลน์ปกติ)
// ───────────────────────────────────────────────────────────

export type SyncStatus = "offline" | "idle" | "syncing" | "synced" | "error";

type SyncUiState = {
  configured: boolean;
  email: string | null;
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  set: (p: Partial<Omit<SyncUiState, "set">>) => void;
};

export const useSyncStore = create<SyncUiState>((set) => ({
  configured: isSyncConfigured,
  email: null,
  status: isSyncConfigured ? "idle" : "offline",
  lastSyncedAt: null,
  error: null,
  set: (p) => set(p),
}));

// module-level (ใช้ร่วมทุก instance)
let localModifiedAt = 0; // เวลาแก้ local ล่าสุด (ms)
let applyingRemote = false; // กัน echo ตอน applyRemoteState
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function getLocalSlice(): SyncSlice {
  return pickSyncSlice(useAppStore.getState());
}

/** pull → merge → push (ครั้งเดียวจบ) */
export async function syncNow(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const ui = useSyncStore.getState();
  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;

  ui.set({ status: "syncing", error: null });
  try {
    const { data, error } = await sb
      .from(STATE_TABLE)
      .select("data, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;

    const local = getLocalSlice();
    let merged = local;
    if (data) {
      const remote = data.data as SyncSlice;
      const remoteUpdatedAt = new Date(data.updated_at as string).getTime();
      const localNewer = localModifiedAt >= remoteUpdatedAt;
      merged = mergeSlice(local, remote, localNewer);
      applyingRemote = true;
      useAppStore.getState().applyRemoteState(merged);
      applyingRemote = false;
    }

    const now = Date.now();
    const { error: upErr } = await sb.from(STATE_TABLE).upsert({
      user_id: user.id,
      data: merged,
      updated_at: new Date(now).toISOString(),
    });
    if (upErr) throw upErr;

    localModifiedAt = now;
    ui.set({ status: "synced", lastSyncedAt: now });
  } catch (e) {
    ui.set({ status: "error", error: (e as Error).message });
  }
}

/** ส่ง magic link เข้าอีเมล — คืน true ถ้าส่งสำเร็จ */
export async function signIn(email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const ui = useSyncStore.getState();
  ui.set({ status: "syncing", error: null });
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) {
    ui.set({ status: "error", error: error.message });
    return false;
  }
  ui.set({ status: "idle", error: null });
  return true;
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  useSyncStore.getState().set({
    email: null,
    status: "idle",
    lastSyncedAt: null,
  });
}

/** เรียกครั้งเดียวที่ root: ตั้ง auth listener + pull แรก + push ตอน local เปลี่ยน */
export function useSyncEngine(): void {
  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const ui = useSyncStore.getState();

    void sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        ui.set({ email: u.email ?? null });
        void syncNow();
      }
    });

    const { data: authSub } = sb.auth.onAuthStateChange((event, session) => {
      const u = session?.user;
      ui.set({ email: u?.email ?? null });
      if (u && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void syncNow();
      }
      if (event === "SIGNED_OUT") {
        ui.set({ status: "idle", lastSyncedAt: null });
      }
    });

    const unsub = useAppStore.subscribe((state, prev) => {
      if (applyingRemote) return;
      if (
        state.swaps === prev.swaps &&
        state.checked === prev.checked &&
        state.log === prev.log &&
        state.profileOverride === prev.profileOverride
      ) {
        return; // ไม่ใช่ slice ที่ sync (เช่น timer/UI) → ข้าม
      }
      localModifiedAt = Date.now();
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(() => void syncNow(), 1500);
    });

    return () => {
      authSub.subscription.unsubscribe();
      unsub();
      if (pushTimer) clearTimeout(pushTimer);
    };
  }, []);
}
