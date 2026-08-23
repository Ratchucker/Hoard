"use client";

// Real account auth via Supabase Auth (email + password). Session state mirrors what
// the previous local mock exposed (user/hydrated/signOut) so existing call sites
// (AuthGate, Topbar) didn't need to change shape — only how they're populated.
//
// Data loading/saving (src/lib/data/sync.ts) is driven entirely from the single
// onAuthStateChange listener below, since Supabase fires that for sign-in, sign-up
// (once a session exists), and session restoration alike — one place, no double-fetching.

import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncOnSignIn, syncOnSignOut } from "@/lib/data/sync";

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthResult {
  error?: string;
  /** True when signUp succeeded but Supabase requires email confirmation before a session exists. */
  needsEmailConfirmation?: boolean;
}

interface AuthState {
  hydrated: boolean;
  user: AuthUser | null;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(() => ({
  hydrated: false,
  user: null,

  signUp: async (email, password) => {
    if (!supabase) return { error: "Supabase is not configured." };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session) return { needsEmailConfirmation: true };
    return {};
  },

  signIn: async (email, password) => {
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
  },
}));

// Restore/track the session on load and across tabs. Runs once at module init in the browser.
if (typeof window !== "undefined" && isSupabaseConfigured && supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session ? { id: session.user.id, email: session.user.email! } : null;
    const previousUserId = useAuthStore.getState().user?.id;
    useAuthStore.setState({ user, hydrated: true });

    if (user && user.id !== previousUserId) {
      syncOnSignIn(user.id);
    } else if (!user && previousUserId) {
      syncOnSignOut();
    }
  });
} else if (typeof window !== "undefined") {
  // No Supabase project configured — surface the "not hydrated forever" state as
  // signed-out rather than an infinite loading skeleton.
  useAuthStore.setState({ hydrated: true, user: null });
}
