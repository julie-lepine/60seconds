-- 60 SECONDS — modale « nouvelle version disponible »
-- À exécuter AVANT de publier la version qui contient la modale.
-- Une ligne par store. Quand une version est EN LIGNE sur un store, mets à jour sa ligne (voir bas du fichier).
--   latest_version : l'app propose la mise à jour (bouton « PLUS TARD » possible, rappel au bout de 3 jours)
--   min_version    : en dessous, la modale est bloquante. Laisse NULL sauf cas grave.
-- La modale n'apparaît que sur les versions qui la contiennent : les anciennes versions ne la verront pas.

create table if not exists public.app_version (
  platform text primary key check (platform in ('ios', 'android')),
  latest_version text not null,
  min_version text,
  updated_at timestamptz not null default now()
);

alter table public.app_version enable row level security;

drop policy if exists app_version_read_public on public.app_version;
create policy app_version_read_public
  on public.app_version
  for select
  to anon, authenticated
  using (true);

-- Lecture seule pour l'app : aucune politique d'écriture (tu modifies depuis l'éditeur SQL).
insert into public.app_version (platform, latest_version)
values ('ios', '1.0.9'), ('android', '1.0.9')
on conflict (platform) do nothing;

-- Quand la version 1.1 est en ligne sur Android, par exemple :
--   update public.app_version set latest_version = '1.1', updated_at = now() where platform = 'android';
-- Pour forcer la mise à jour (cas grave uniquement) :
--   update public.app_version set min_version = '1.1', updated_at = now() where platform = 'android';
