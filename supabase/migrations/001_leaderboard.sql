-- 60 SECONDS — classements Normal + Daily
-- À exécuter dans l'éditeur SQL du projet Supabase (Dashboard → SQL Editor → New query).

create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  score integer not null,
  mode text not null,
  daily_date date,
  created_at timestamptz not null default now(),
  constraint leaderboard_mode_check check (mode in ('normal', 'daily')),
  constraint leaderboard_score_check check (score >= 0),
  constraint leaderboard_username_check check (char_length(username) between 3 and 16),
  constraint leaderboard_date_check check (
    (mode = 'normal' and daily_date is null)
    or (mode = 'daily' and daily_date is not null)
  )
);

create index if not exists leaderboard_normal_rank_idx
  on public.leaderboard (score desc, created_at asc)
  where mode = 'normal';

create index if not exists leaderboard_daily_rank_idx
  on public.leaderboard (daily_date, score desc, created_at asc)
  where mode = 'daily';

alter table public.leaderboard enable row level security;

drop policy if exists leaderboard_read_public on public.leaderboard;
drop policy if exists leaderboard_insert_public on public.leaderboard;

create policy leaderboard_read_public
  on public.leaderboard
  for select
  to anon, authenticated
  using (true);

create policy leaderboard_insert_public
  on public.leaderboard
  for insert
  to anon, authenticated
  with check (
    mode in ('normal', 'daily')
    and score >= 0
    and char_length(username) between 3 and 16
    and (
      (mode = 'normal' and daily_date is null)
      or (mode = 'daily' and daily_date is not null)
    )
  );

grant select, insert on table public.leaderboard to anon, authenticated;
revoke update, delete on table public.leaderboard from anon, authenticated;
