-- 60 SECONDS — plafond de score (anti-triche basique)
-- À exécuter dans l'éditeur SQL du projet Supabase.

alter table public.leaderboard drop constraint if exists leaderboard_score_check;
alter table public.leaderboard
  add constraint leaderboard_score_check check (score >= 0 and score <= 50000);

drop policy if exists leaderboard_insert_public on public.leaderboard;
create policy leaderboard_insert_public
  on public.leaderboard
  for insert
  to anon, authenticated
  with check (
    mode in ('normal', 'daily')
    and score >= 0
    and score <= 50000
    and char_length(username) between 3 and 16
    and (
      (mode = 'normal' and daily_date is null)
      or (mode = 'daily' and daily_date is not null)
    )
  );
