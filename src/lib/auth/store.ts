"use client";

// A minimal local auth layer shaped after Supabase Auth (user/session, signIn/signUp/signOut)
// so it can be swapped for `@supabase/supabase-js` later without touching call sites.
// There is no real password hashing or server verification here — this is a local,
// single-device demo account, not a security boundary.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  hydrated: boolean;
  user: AuthUser | null;
  signIn: (email: string, name: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      user: null,
      signIn: (email, name) => set({ user: { id: crypto.randomUUID(), email, name: name || email.split("@")[0] } }),
      signOut: () => set({ user: null }),
    }),
    {
      name: "card-roi-app-auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
