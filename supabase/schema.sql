-- supabase/schema.sql — schéma idempotent Lire Marx
-- À rejouer librement : chaque instruction est idempotente.

-- ── reading_progress ──────────────────────────────────────────────────────────
-- Suivi de progression de lecture par utilisateur et par œuvre.
-- user_id défini par défaut à auth.uid() — ne pas le poser explicitement à
-- l'INSERT (même règle que la table annotations existante).

create table if not exists public.reading_progress (
  user_id      uuid         not null default auth.uid(),
  work         text         not null,
  section      integer      not null,
  completed    boolean      not null default true,
  completed_at timestamptz  not null default now(),
  constraint reading_progress_pkey primary key (user_id, work, section)
);

alter table public.reading_progress enable row level security;

-- Policies RLS — lecture et écriture limitées à ses propres lignes
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_select_own'
  ) then
    execute '
      create policy rp_select_own on public.reading_progress
        for select using (user_id = auth.uid())
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_insert_own'
  ) then
    execute '
      create policy rp_insert_own on public.reading_progress
        for insert with check (user_id = auth.uid())
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_update_own'
  ) then
    execute '
      create policy rp_update_own on public.reading_progress
        for update
        using  (user_id = auth.uid())
        with check (user_id = auth.uid())
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_delete_own'
  ) then
    execute '
      create policy rp_delete_own on public.reading_progress
        for delete using (user_id = auth.uid())
    ';
  end if;
end $$;
