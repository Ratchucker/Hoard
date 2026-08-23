-- Collectfolio: per-user data storage.
-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL Editor → New query).
--
-- Design: rather than normalizing every entity (collectibles, sales, expenses, ...) into
-- its own table, each user gets a single row holding their entire app state as JSON. This
-- matches the app's existing client-side data shape exactly (src/lib/data/store.ts), so the
-- whole UI and calculation layer works unchanged — only the persistence layer moved from
-- localStorage to Supabase. Security is enforced by Postgres Row Level Security: a user can
-- only ever read or write their own row.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users can read their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own data"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- Keep updated_at current on every write.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_data_updated_at on public.user_data;
create trigger set_user_data_updated_at
  before update on public.user_data
  for each row
  execute function public.set_updated_at();
