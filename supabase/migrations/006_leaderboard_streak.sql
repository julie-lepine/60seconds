-- 60 SECONDS — badge de série dans le classement
-- À exécuter APRÈS 005 (ou à la place si 005 n'a pas encore été lancée : les deux sont compatibles).
-- Ajoute la série en cours à chaque score, et la renvoie par leaderboard_board.
-- L'app retombe sur un envoi sans série si cette colonne n'existe pas : aucun score ne se perd.
--
-- La série affichée est celle de la DERNIÈRE partie du joueur, et seulement s'il a joué
-- dans les 3 derniers jours (sinon elle est périmée et le badge disparaît).

alter table public.leaderboard add column if not exists streak integer;
alter table public.leaderboard drop constraint if exists leaderboard_streak_check;
alter table public.leaderboard
  add constraint leaderboard_streak_check check (streak is null or (streak >= 0 and streak <= 10000));

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
    and (streak is null or (streak >= 0 and streak <= 10000))
    and (
      (mode in ('normal', 'hardcore') and daily_date is null)
      or (mode = 'daily' and daily_date is not null)
    )
  );

-- Le type de retour change : on remplace la fonction de 005.
drop function if exists public.leaderboard_board(text, text, date, text, integer, integer);

create function public.leaderboard_board(
  p_mode text,
  p_period text default 'all',
  p_daily_date date default null,
  p_username text default null,
  p_top integer default 10,
  p_around integer default 1
)
returns table(
  rank bigint,
  username text,
  score integer,
  total bigint,
  streak integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with best as (
    select distinct on (l.username) l.username, l.score, l.created_at
    from public.leaderboard l
    where case
      when p_mode = 'daily' then l.mode = 'daily' and l.daily_date = p_daily_date
      when p_mode = 'hardcore' then l.mode = 'hardcore'
      else l.mode in ('normal', 'daily')
    end
    and (
      p_mode = 'daily'
      or coalesce(p_period, 'all') <> 'month'
      or l.created_at >= (date_trunc('month', now() at time zone 'utc') at time zone 'utc')
    )
    order by l.username, l.score desc, l.created_at asc
  ),
  ranked as (
    select
      row_number() over (order by b.score desc, b.created_at asc, b.username asc) as rank,
      b.username,
      b.score,
      count(*) over () as total
    from best b
  ),
  me as (
    select r.rank from ranked r where r.username = p_username
  ),
  picked as (
    select r.rank, r.username, r.score, r.total
    from ranked r
    where r.rank <= least(greatest(coalesce(p_top, 10), 1), 50)
       or exists (
         select 1 from me
         where r.rank between me.rank - least(greatest(coalesce(p_around, 1), 0), 3)
                          and me.rank + least(greatest(coalesce(p_around, 1), 0), 3)
       )
  )
  select
    p.rank, p.username, p.score, p.total,
    (
      select l2.streak
      from public.leaderboard l2
      where l2.username = p.username
        and l2.created_at >= now() - interval '3 days'
      order by l2.created_at desc
      limit 1
    ) as streak
  from picked p
  order by p.rank;
$$;

grant execute on function public.leaderboard_board(text, text, date, text, integer, integer)
  to anon, authenticated;
