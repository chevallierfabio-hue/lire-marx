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

-- ── modération (mission moderation-5c) ───────────────────────────────────────
-- Les tables `moderators` et `reports` EXISTAIENT déjà (créées à la main
-- au début du projet) : les blocs ci-dessous documentent leur structure
-- RÉELLE — `create if not exists` est un no-op sur la base en place mais
-- garde ce fichier comme référence — puis posent les défauts manquants
-- et les policies. `moderators` n'a qu'UNE colonne : id = user_id du
-- modérateur (table remplie à la main depuis le dashboard — pas d'UI
-- d'administration). `reports` suit le style de public_notes : id text
-- généré côté client, created en millisecondes (Date.now()),
-- reporter_id posé par défaut à auth.uid() — ne jamais l'écrire à
-- l'INSERT (règle maison).

create table if not exists public.moderators (
  id uuid primary key
);

create table if not exists public.reports (
  id          text    primary key,
  note_id     text    not null,
  reporter_id uuid,
  reason      text,
  created     bigint,
  resolved    boolean
);

alter table public.reports alter column reporter_id set default auth.uid();
alter table public.reports alter column resolved    set default false;

alter table public.moderators enable row level security;
alter table public.reports    enable row level security;

do $$ begin
  -- chacun ne peut lire QUE sa propre ligne : c'est le test « suis-je
  -- modérateur ? » du client, et rien d'autre ne sort de la table
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'moderators'
      and policyname = 'mod_select_self'
  ) then
    execute '
      create policy mod_select_self on public.moderators
        for select using (id = auth.uid())
    ';
  end if;

  -- tout connecté peut signaler (en son nom uniquement)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'rep_insert_own'
  ) then
    execute '
      create policy rep_insert_own on public.reports
        for insert with check (reporter_id = auth.uid())
    ';
  end if;

  -- seuls les modérateurs lisent et classent les signalements
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'rep_select_mod'
  ) then
    execute '
      create policy rep_select_mod on public.reports
        for select using (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'rep_update_mod'
  ) then
    execute '
      create policy rep_update_mod on public.reports
        for update
        using (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
        with check (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
    ';
  end if;

  -- les modérateurs peuvent basculer public_notes.hidden (policy
  -- PERMISSIVE : elle s'ajoute au droit de l'auteur sans le toucher)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'public_notes'
      and policyname = 'pn_update_mod'
  ) then
    execute '
      create policy pn_update_mod on public.public_notes
        for update
        using (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
        with check (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
    ';
  end if;
end $$;
