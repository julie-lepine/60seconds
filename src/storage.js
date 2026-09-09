import { G } from './state.js';

const KEYS = {
  normal: '60seconds_best_normal',
  daily: '60seconds_best_daily',
  username: '60seconds_username',
  reduceMotion: '60seconds_reduce_motion',
  dailyRun: '60seconds_daily_run',
  privacyNotice: '60seconds_privacy_notice',
  adsTracking: '60seconds_ads_tracking'
};

function keyFor(mode){
  return mode === 'daily' ? KEYS.daily : KEYS.normal;
}

function parseStored(raw){
  if(raw == null || raw === '') return 0;
  const n = Number(raw);
  if(!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n;
}

export function getBestScore(mode){
  try{
    return parseStored(localStorage.getItem(keyFor(mode)));
  }catch{
    return 0;
  }
}

export function saveBestScore(mode, score){
  const n = Number(score);
  if(!Number.isFinite(n) || n < 0) return;
  if(n <= getBestScore(mode)) return;
  try{
    localStorage.setItem(keyFor(mode), String(n));
  }catch{}
}

export function normalizeUsername(raw){
  return String(raw ?? '').trim();
}

export function isValidUsername(raw){
  const name = normalizeUsername(raw);
  if(name.length < 3 || name.length > 16) return false;
  return /^[\p{L}\p{N}]+(?: +[\p{L}\p{N}]+)*$/u.test(name);
}

export function getUsername(){
  try{
    const name = normalizeUsername(localStorage.getItem(KEYS.username));
    return isValidUsername(name) ? name : '';
  }catch{
    return '';
  }
}

export function saveUsername(username){
  const name = normalizeUsername(username);
  if(!isValidUsername(name)) return false;
  try{
    localStorage.setItem(KEYS.username, name);
    return true;
  }catch{
    return false;
  }
}

function osPrefersReducedMotion(){
  try{
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }catch{
    return false;
  }
}

export function getReduceMotion(){
  try{
    const raw = localStorage.getItem(KEYS.reduceMotion);
    if(raw === 'true') return true;
    if(raw === 'false') return false;
  }catch{}
  return osPrefersReducedMotion();
}

export function applyReduceMotion(value = getReduceMotion()){
  const on = !!value;
  G.reduceMotion = on;
  try{ document.documentElement.classList.toggle('reduce', on); }catch{}
  return on;
}

export function saveReduceMotion(value){
  const on = !!value;
  try{ localStorage.setItem(KEYS.reduceMotion, on ? 'true' : 'false'); }catch{}
  return applyReduceMotion(on);
}

function todayKey(now = new Date()){
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDailyRun(){
  try{
    const raw = localStorage.getItem(KEYS.dailyRun);
    if(!raw) return null;
    const data = JSON.parse(raw);
    if(!data || data.date !== todayKey()) return null;
    const score = Number(data.score);
    return { date: data.date, score: Number.isFinite(score) && score >= 0 ? score : 0 };
  }catch{
    return null;
  }
}

export function saveTodayDailyRun(score){
  const n = Number(score);
  const safe = Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
  try{
    localStorage.setItem(KEYS.dailyRun, JSON.stringify({ date: todayKey(), score: safe }));
  }catch{}
}

export function hasPrivacyNotice(){
  try{
    return localStorage.getItem(KEYS.privacyNotice) === '1';
  }catch{
    return false;
  }
}

export function savePrivacyNotice(){
  try{
    localStorage.setItem(KEYS.privacyNotice, '1');
  }catch{}
}

export function getAdsTracking(){
  try{
    return localStorage.getItem(KEYS.adsTracking) !== 'false';
  }catch{
    return true;
  }
}

export function saveAdsTracking(value){
  const on = !!value;
  try{
    localStorage.setItem(KEYS.adsTracking, on ? 'true' : 'false');
  }catch{}
  return on;
}
