// Modale « nouvelle version disponible » à l'ouverture de l'app.
// La version la plus récente de chaque store est lue dans la table Supabase `app_version`
// (migration 007) : tu la mets à jour quand une version est en ligne sur le store.
//   latest_version : version à proposer (modale avec « PLUS TARD »)
//   min_version    : version minimale (modale bloquante, sans « PLUS TARD ») — laisser vide par défaut
import { Capacitor } from '@capacitor/core';
import { t } from './i18n.js';
import { STORE_URLS, FALLBACK_APP_VERSION } from './constants.js';
import { supabaseFetch } from './leaderboard/leaderboard.js';

const DISMISS_KEY = '60seconds_update_dismissed';
// Après « PLUS TARD », on repropose la même version au bout de 3 jours.
export const REMIND_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export function compareVersions(a, b){
  const parse = v => String(v ?? '').split('.').map(x => {
    const n = parseInt(x, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  });
  const left = parse(a), right = parse(b);
  const length = Math.max(left.length, right.length);
  for(let i = 0; i < length; i++){
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if(diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}

// Renvoie 'none' | 'optional' | 'required'. Fonction pure.
export function decideUpdate({ current, latest, min, dismissed, now = Date.now() }){
  if(min && compareVersions(current, min) < 0) return 'required';
  if(latest && compareVersions(current, latest) < 0){
    const recent = dismissed && dismissed.version === latest && now - Number(dismissed.at) < REMIND_AFTER_MS;
    return recent ? 'none' : 'optional';
  }
  return 'none';
}

export function readDismissed(){
  try{
    const data = JSON.parse(localStorage.getItem(DISMISS_KEY) || 'null');
    return data && typeof data.version === 'string' && Number.isFinite(Number(data.at)) ? data : null;
  }catch{
    return null;
  }
}

export function saveDismissed(version, now = Date.now()){
  try{ localStorage.setItem(DISMISS_KEY, JSON.stringify({ version, at: now })); }catch{}
}

export function getPlatform(){
  try{
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android' ? platform : null;
  }catch{
    return null;
  }
}

export async function getAppVersion(){
  try{
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    if(info?.version) return String(info.version);
  }catch{}
  return FALLBACK_APP_VERSION;
}

async function fetchVersionRow(platform){
  const { ok, data } = await supabaseFetch(`app_version?platform=eq.${platform}&select=latest_version,min_version&limit=1`, { method: 'GET' });
  if(!ok || !Array.isArray(data) || !data[0]) return null;
  return data[0];
}

// Vérifie s'il faut afficher la modale. Ne lève jamais d'erreur.
// Renvoie { status, latest, url } ; status = 'none' sur le web, hors ligne ou en cas d'erreur.
export async function checkForUpdate(deps = {}){
  const none = { status: 'none', latest: null, url: null };
  try{
    const platform = deps.platform ?? getPlatform();
    if(!platform) return none;
    const row = await (deps.fetchRow || fetchVersionRow)(platform);
    if(!row) return none;
    const current = deps.current ?? await getAppVersion();
    const status = decideUpdate({
      current,
      latest: row.latest_version || null,
      min: row.min_version || null,
      dismissed: deps.dismissed === undefined ? readDismissed() : deps.dismissed,
      now: deps.now
    });
    return { status, latest: row.latest_version || null, url: STORE_URLS[platform] };
  }catch{
    return none;
  }
}

export function showUpdateModal({ status, latest, url }, doc = document){
  if(status !== 'optional' && status !== 'required') return null;
  const existing = doc.getElementById('updateModal');
  if(existing) existing.remove();
  const required = status === 'required';
  const modal = doc.createElement('div');
  modal.id = 'updateModal';
  modal.className = 'update-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `<div class="update-card">
      <div class="update-title display">${t('updateTitle')}</div>
      <div class="update-text">${t(required ? 'updateBodyRequired' : 'updateBody')}</div>
      <a class="update-go" id="updateGo" href="${url}" target="_blank" rel="noopener">${t('updateGo')}</a>
      ${required ? '' : `<button class="update-later" id="updateLater" type="button">${t('updateLater')}</button>`}
    </div>`;
  doc.body.appendChild(modal);
  doc.getElementById('updateLater')?.addEventListener('click', () => {
    saveDismissed(latest);
    modal.remove();
  });
  return modal;
}

export async function maybeShowUpdateModal(deps = {}){
  const result = await checkForUpdate(deps);
  if(result.status === 'none') return result;
  showUpdateModal(result);
  return result;
}
