"use client";

// Browser Supabase client. The URL and anon key are meant to be public — Supabase's
// security boundary is Row Level Security policies (see supabase/schema.sql), not
// secrecy of the anon key. Both are read from NEXT_PUBLIC_* env vars so they're
// baked into the client bundle at build time.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
