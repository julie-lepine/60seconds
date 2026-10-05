import { G } from './state.js';
import { Preferences } from '@capacitor/preferences';

const KEYS = {
  normal: '60seconds_best_normal',
  daily: '60seconds_best_daily',
  username: '60seconds_username',
  reduceMotion: '60seconds_reduce_motion',
  dailyRun: '60seconds_daily_run',
  privacyNotice: '60seconds_privacy_notice',
  adsTracking: '60seconds_ads_tracking',
  sound: '60seconds_sound',
  streak: '60seconds_streak_v1',
  legacyStreak: '60seconds_streak'
};

export const STORAGE_WRITE_STATUS = Object.freeze({
  saved: 'saved',
  unchanged: 'unchanged',
  failed: 'failed'
});

const EMPTY_STREAK = Object.freeze({
  version: 1,
  currentStreak: 0,
  lastCompletedLocalDate: null
});

let streak = { ...EMPTY_STREAK };

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
  if(!Number.isFinite(n) || n < 0) return STORAGE_WRITE_STATUS.failed;
  const key = keyFor(mode);
  let current;
  try{
    current = parseStored(localStorage.getItem(key));
  }catch{
    return STORAGE_WRITE_STATUS.failed;
  }
  if(n <= current) return STORAGE_WRITE_STATUS.unchanged;
  try{
    localStorage.setItem(key, String(n));
    const stored = parseStored(localStorage.getItem(key));
    return stored >= n ? STORAGE_WRITE_STATUS.saved : STORAGE_WRITE_STATUS.failed;
  }catch{
    return STORAGE_WRITE_STATUS.failed;
  }
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

export function getSound(){
  try{
    const raw = localStorage.getItem(KEYS.sound);
    if(raw === 'true') return true;
    if(raw === 'false') return false;
  }catch{}
  return true;
}

export function applySound(value = getSound()){
  G.sound = !!value;
  return G.sound;
}

export function saveSound(value){
  const on = !!value;
  try{ localStorage.setItem(KEYS.sound, on ? 'true' : 'false'); }catch{}
  return applySound(on);
}

function todayKey(now = new Date()){
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
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
  const expected = { date: todayKey(), score: safe };
  let raw;
  try{
    raw = localStorage.getItem(KEYS.dailyRun);
  }catch{
    return STORAGE_WRITE_STATUS.failed;
  }
  if(raw){
    try{
      const current = JSON.parse(raw);
      if(current?.date === expected.date && Number(current.score) === expected.score){
        return STORAGE_WRITE_STATUS.unchanged;
      }
    }catch{}
  }
  try{
    localStorage.setItem(KEYS.dailyRun, JSON.stringify(expected));
    const stored = JSON.parse(localStorage.getItem(KEYS.dailyRun) || 'null');
    return stored?.date === expected.date && Number(stored.score) === expected.score
      ? STORAGE_WRITE_STATUS.saved
      : STORAGE_WRITE_STATUS.failed;
  }catch{
    return STORAGE_WRITE_STATUS.failed;
  }
}

export function localDateKey(now = new Date()){
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateOrdinal(key){
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  if(!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(Date.UTC(y, m - 1, d));
  if(date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return Math.floor(date.getTime() / 86400000);
}

function normalizeStreak(raw){
  if(!raw || typeof raw !== 'object') return { ...EMPTY_STREAK };
  const current = Number(raw.currentStreak ?? raw.current ?? 0);
  const last = raw.lastCompletedLocalDate ?? raw.lastDate ?? null;
  return {
    version: 1,
    currentStreak: Number.isInteger(current) && current > 0 ? current : 0,
    lastCompletedLocalDate: dateOrdinal(last) == null ? null : String(last)
  };
}

function parseStreak(raw){
  if(!raw) return null;
  try{
    return normalizeStreak(JSON.parse(raw));
  }catch{
    return null;
  }
}

async function readPreference(key){
  try{
    const { value } = await Preferences.get({ key });
    if(value != null) return value;
  }catch{}
  try{ return localStorage.getItem(key); }catch{ return null; }
}

async function persistStreak(){
  const value = JSON.stringify(streak);
  try{
    await Preferences.set({ key: KEYS.streak, value });
  }catch{
    try{ localStorage.setItem(KEYS.streak, value); }catch{}
  }
}

export async function initializeStreak(){
  const stored = parseStreak(await readPreference(KEYS.streak));
  if(stored){
    streak = stored;
    return getStreakStatus();
  }

  const legacy = parseStreak(await readPreference(KEYS.legacyStreak));
  streak = legacy || { ...EMPTY_STREAK };
  if(legacy) await persistStreak();
  return getStreakStatus();
}

export function getStreakStatus(now = new Date()){
  const today = dateOrdinal(localDateKey(now));
  const last = dateOrdinal(streak.lastCompletedLocalDate);
  const daysSince = today != null && last != null ? today - last : null;
  const active = daysSince != null && daysSince >= 0 && daysSince <= 1;
  return {
    count: active ? streak.currentStreak : 0,
    completedToday: daysSince === 0,
    lastCompletedLocalDate: streak.lastCompletedLocalDate
  };
}

export function completeStreakDay(now = new Date()){
  const date = localDateKey(now);
  const today = dateOrdinal(date);
  const last = dateOrdinal(streak.lastCompletedLocalDate);
  const daysSince = today != null && last != null ? today - last : null;

  if(daysSince === 0 || (daysSince != null && daysSince < 0)){
    return { ...getStreakStatus(now), increased: false };
  }

  streak = {
    version: 1,
    currentStreak: daysSince === 1 ? Math.max(1, streak.currentStreak + 1) : 1,
    lastCompletedLocalDate: date
  };
  void persistStreak();
  return { ...getStreakStatus(now), increased: true };
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
