-- 60 SECONDS — Top 50 des scores (chaque partie = une ligne)
-- GÉNÉRAL = toutes les parties (Normal + Daily). DU JOUR = parties daily du jour.
-- Un même joueur peut occuper plusieurs places.
-- À exécuter dans l'éditeur SQL (Dashboard → SQL Editor → New query).
-- Si tu as déjà exécuté ce fichier, relance-le : CREATE OR REPLACE met à jour les fonctions.

create index if not exists leaderboard_score_rank_idx
  on public.leaderboard (score desc, created_at asc);

create index if not exists leaderboard_best_overall_idx
  on public.leaderboard (username, score desc, created_at asc);

create index if not exists leaderboard_best_normal_idx
  on public.leaderboard (username, score desc, created_at asc)
  where mode = 'normal';

create index if not exists leaderboard_best_daily_idx
  on public.leaderboard (daily_date, username, score desc, created_at asc)
  where mode = 'daily';

create or replace function public.leaderboard_top(
  p_mode text,
  p_daily_date date default null,
  p_limit integer default 50
)
returns table(
  id uuid,
  username text,
  score integer,
  mode text,
  daily_date date,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select l.id, l.username, l.score, l.mode, l.daily_date, l.created_at
  from public.leaderboard l
  where (
    p_mode = 'daily'
    and l.mode = 'daily'
    and l.daily_date = p_daily_date
  )
  or p_mode is distinct from 'daily'
  order by l.score desc, l.created_at asc, l.username asc
  limit least(greatest(coalesce(p_limit, 50), 1), 50);
$$;

create or replace function public.leaderboard_player_rank(
  p_mode text,
  p_username text,
  p_daily_date date default null
)
returns table(score integer, rank bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with scoped as (
    select l.id, l.username, l.score, l.created_at
    from public.leaderboard l
    where (
      p_mode = 'daily'
      and l.mode = 'daily'
      and l.daily_date = p_daily_date
    )
    or p_mode is distinct from 'daily'
  ),
  me as (
    select s.id, s.username, s.score, s.created_at
    from scoped s
    where s.username = p_username
    order by s.score desc, s.created_at asc, s.id asc
    limit 1
  )
  select
    me.score,
    (
      select count(*)::bigint + 1
      from scoped b
      where b.score > me.score
         or (b.score = me.score and b.created_at < me.created_at)
         or (b.score = me.score and b.created_at = me.created_at and b.username < me.username)
         or (b.score = me.score and b.created_at = me.created_at and b.username = me.username and b.id < me.id)
    ) as rank
  from me;
$$;

grant execute on function public.leaderboard_top(text, date, integer) to anon, authenticated;
grant execute on function public.leaderboard_player_rank(text, text, date) to anon, authenticated;
