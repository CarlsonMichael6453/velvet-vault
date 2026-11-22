-- Velvet Vault cloud saves.
-- One row per signed-in player. The anon key can only touch the signed-in user's row.
--
-- Michael, to turn this on:
-- 1. Create a project at https://supabase.com/dashboard.
-- 2. Authentication → Providers → Email: leave Email enabled.
--    For the easiest first test, turn OFF "Confirm email". Turn it back on before a public launch.
-- 3. Authentication → Providers: Apple and Google can wait. The app shows them as later.
-- 4. SQL Editor → paste this file → Run. Safe to run again.
-- 5. Project Settings → API: copy the Project URL and the anon public key.
--    Do not put the service_role key in the app.
-- 6. For a local build, put them in .env.local:
--      EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
--      EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
-- 7. For the GitHub Pages site, add those same names as Actions secrets
--    on CarlsonMichael6453/velvet-vault, then re-run Deploy GitHub Pages.
--    Expo bakes EXPO_PUBLIC_ values in at export time. An empty secret keeps the
--    "cloud save coming soon" screen.

create table if not exists public.vault_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.vault_saves enable row level security;

drop policy if exists "vault_saves_select_own" on public.vault_saves;
drop policy if exists "vault_saves_insert_own" on public.vault_saves;
drop policy if exists "vault_saves_update_own" on public.vault_saves;
drop policy if exists "vault_saves_delete_own" on public.vault_saves;

create policy "vault_saves_select_own"
  on public.vault_saves
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "vault_saves_insert_own"
  on public.vault_saves
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "vault_saves_update_own"
  on public.vault_saves
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "vault_saves_delete_own"
  on public.vault_saves
  for delete
  to authenticated
  using (auth.uid() = user_id);
