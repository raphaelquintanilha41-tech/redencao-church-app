-- Phase 1 — Foundation
-- Redenção Church App: auth foundation, profiles table, RLS, avatar storage.
-- Ref: README.md "Phase 1 — Foundation"
--
-- Run against a Supabase project (SQL Editor, or `supabase db push`).
-- Not run or tested against a live project yet — validate on a real
-- Supabase instance before relying on it, especially the RLS policies
-- and the storage bucket policies (test with two accounts, per the
-- README's "Two-account test").

-- ── profiles ───────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read only their own profile row.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

-- A user can insert only a profile row for themselves.
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- A user can update only their own profile row.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy: profile deletion should go through a controlled
-- "excluir minha conta" flow (Security & Compliance, GDPR), not a
-- direct table delete — handle via an edge function/RPC that also
-- cleans up dependent rows.

-- Keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up, seeded from
-- signup metadata (nome) and email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── storage: avatars ──────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Convention: object path must be "<user_id>/<filename>" so ownership
-- can be checked from the path itself.
create policy "avatar_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatar_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
