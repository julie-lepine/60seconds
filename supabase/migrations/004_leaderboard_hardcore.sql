-- 60 SECONDS — classement HARDCORE
-- À exécuter dans l'éditeur SQL du projet Supabase AVANT de publier la version avec le mode hardcore.
-- Les versions déjà installées continuent de fonctionner : leur onglet GÉNÉRAL (p_mode = 'normal')
-- reste Normal + Daily et n'affiche jamais les parties hardcore.

-- 1. Nouveau mode autorisé (le hardcore n'a pas de date, comme le mode normal).
alter table public.leaderboard drop constraint if exists leaderboard_mode_check;
alter table public.leaderboard
  add constraint leaderboard_mode_check check (mode in ('normal', 'daily', 'hardcore'));

alter table public.leaderboard drop constraint if exists leaderboard_date_check;
alter table public.leaderboard
  add constraint leaderboard_date_check check (
    (mode in ('normal', 'hardcore') and daily_date is null)
    or (mode = 'daily' and daily_date is not null)
  );

create index if not exists leaderboard_hardcore_rank_idx
  on public.leaderboard (score desc, created_at asc)
  where mode = 'hardcore';

drop policy if exists leaderboard_insert_public on public.leaderboard;
create policy leaderboard_insert_public
  on public.leaderboard
  for insert
  to anon, authenticated
  with check (
    mode in ('normal', 'daily', 'hardcore')
    and score >= 0
    and score <= 50000
    and char_length(username) between 3 and 16
    and (
      (mode in ('normal', 'hardcore') and daily_date is null)
      or (mode = 'daily' and daily_date is not null)
    )
  );

-- 2. Les deux fonctions de classement connaissent maintenant trois portées :
--    'daily'    = défi du jour (date donnée)
--    'hardcore' = parties hardcore uniquement
--    sinon      = GÉNÉRAL = Normal + Daily (comportement inchangé, hardcore exclu)
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
  where case
    when p_mode = 'daily' then l.mode = 'daily' and l.daily_date = p_daily_date
    when p_mode = 'hardcore' then l.mode = 'hardcore'
    else l.mode in ('normal', 'daily')
  end
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
    where case
      when p_mode = 'daily' then l.mode = 'daily' and l.daily_date = p_daily_date
      when p_mode = 'hardcore' then l.mode = 'hardcore'
      else l.mode in ('normal', 'daily')
    end
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
