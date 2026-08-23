"use client";

// Bridges the in-memory Zustand store (src/lib/data/store.ts) to Supabase: fetches the
// signed-in user's data on login (seeding a fresh row for brand-new accounts), and
// debounce-saves the full state back to Supabase on every change while signed in.

import { supabase } from "@/lib/supabase/client";
import { useStore, extractRemoteData, type RemoteData } from "@/lib/data/store";
import { buildSeedData } from "@/lib/data/seed";

const TABLE = "user_data";
const SAVE_DEBOUNCE_MS = 1200;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeFromStore: (() => void) | null = null;
let currentUserId: string | null = null;

async function fetchRemoteData(userId: string): Promise<RemoteData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("data").eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("Failed to load your data:", error.message);
    return null;
  }
  return (data?.data as RemoteData | undefined) ?? null;
}

async function saveRemoteData(userId: string, data: RemoteData) {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).upsert({ user_id: userId, data }, { onConflict: "user_id" });
  if (error) console.error("Failed to save your changes:", error.message);
}

function scheduleSave(userId: string) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveRemoteData(userId, extractRemoteData(useStore.getState()));
  }, SAVE_DEBOUNCE_MS);
}

/** Call when a user signs in (or a session is restored): loads their data, seeding a new row for first-time users. */
export async function syncOnSignIn(userId: string) {
  currentUserId = userId;
  useStore.getState().setHydrated(false);

  const remote = await fetchRemoteData(userId);
  if (currentUserId !== userId) return; // a sign-out/switch happened while this was in flight

  if (remote) {
    useStore.getState().hydrateFromRemote(remote);
  } else {
    const seed = buildSeedData();
    useStore.getState().hydrateFromRemote(seed);
    await saveRemoteData(userId, seed);
  }

  unsubscribeFromStore?.();
  unsubscribeFromStore = useStore.subscribe(() => {
    if (currentUserId) scheduleSave(currentUserId);
  });
}

/** Call when the user signs out: stops syncing and clears the loaded flag so the next
 *  account starts from a loading state instead of flashing this user's data. */
export function syncOnSignOut() {
  currentUserId = null;
  if (saveTimer) clearTimeout(saveTimer);
  unsubscribeFromStore?.();
  unsubscribeFromStore = null;
  useStore.getState().setHydrated(false);
}
