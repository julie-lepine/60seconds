-- 60 SECONDS — classement : top 10 + « autour de toi » + rang, avec filtre MOIS / TOUT
-- À exécuter dans l'éditeur SQL du projet Supabase AVANT de publier la version qui l'utilise.
-- Ajoute UNE nouvelle fonction ; leaderboard_top et leaderboard_player_rank ne changent pas,
-- les versions déjà installées continuent donc de fonctionner. La nouvelle version de l'app
-- retombe sur l'ancien classement si cette fonction est absente.
--
-- Une ligne par JOUEUR (son meilleur score sur la portée demandée) :
--   p_mode   : 'daily' (défi du jour, p_daily_date), 'hardcore', sinon GÉNÉRAL = normal + daily
--   p_period : 'month' = depuis le 1er du mois courant (UTC), sinon tout l'historique
--              (ignoré pour 'daily')
-- Renvoie le top p_top, plus les p_around voisins de chaque côté du joueur p_username,
-- avec le nombre total de joueurs classés (pour le rang en %).

create or replace function public.leaderboard_board(
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
  total bigint
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
  )
  select r.rank, r.username, r.score, r.total
  from ranked r
  where r.rank <= least(greatest(coalesce(p_top, 10), 1), 50)
     or exists (
       select 1 from me
       where r.rank between me.rank - least(greatest(coalesce(p_around, 1), 0), 3)
                        and me.rank + least(greatest(coalesce(p_around, 1), 0), 3)
     )
  order by r.rank;
$$;

grant execute on function public.leaderboard_board(text, text, date, text, integer, integer)
  to anon, authenticated;
