// Rappel du défi du jour : notifications LOCALES (aucun serveur).
// À chaque ouverture / fin de partie, on annule tout puis on reprogramme les 7 prochains jours :
// un joueur qui a déjà joué n'est donc jamais notifié pour rien.
import { Capacitor } from '@capacitor/core';
import { t } from './i18n.js';
import { getTodayDailyRun } from './storage.js';
import { getAchievementStreakStatus } from './achievements/storage.js';

const KEYS = {
  enabled: '60seconds_notif_enabled',
  time: '60seconds_notif_time',
  asked: '60seconds_notif_asked'
};

export const DEFAULT_TIME = '12:00';
export const EVENING_TIME = '20:30';
export const PLAN_DAYS = 7;
const MORNING_ID_BASE = 1000;
const EVENING_ID = 2000;
// Si le rappel du joueur est déjà tard, pas de second rappel le même soir.
const EVENING_MIN_GAP_HOUR = 19;

export function isNotificationSupported(){
  try{ return Capacitor.isNativePlatform(); }catch{ return false; }
}

export function parseTime(value, fallback = DEFAULT_TIME){
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
  const use = match || /^(\d{1,2}):(\d{2})$/.exec(fallback);
  let hour = Number(use[1]);
  let minute = Number(use[2]);
  if(!(hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)){
    const safe = /^(\d{1,2}):(\d{2})$/.exec(fallback);
    hour = Number(safe[1]); minute = Number(safe[2]);
  }
  return { hour, minute };
}

export function formatTime({ hour, minute }){
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getNotificationPrefs(){
  try{
    return {
      enabled: localStorage.getItem(KEYS.enabled) === '1',
      time: formatTime(parseTime(localStorage.getItem(KEYS.time))),
      asked: localStorage.getItem(KEYS.asked) === '1'
    };
  }catch{
    return { enabled: false, time: DEFAULT_TIME, asked: false };
  }
}

export function saveNotificationPrefs({ enabled, time, asked } = {}){
  try{
    if(enabled != null) localStorage.setItem(KEYS.enabled, enabled ? '1' : '0');
    if(time != null) localStorage.setItem(KEYS.time, formatTime(parseTime(time)));
    if(asked != null) localStorage.setItem(KEYS.asked, asked ? '1' : '0');
  }catch{}
}

function atLocal(now, dayOffset, { hour, minute }){
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute, 0, 0);
}

// Calcule les notifications à programmer. Fonction pure (testable).
//   dailyDone      : le défi du jour est déjà fait aujourd'hui
//   streak         : série en cours (nombre de jours)
//   completedToday : une partie a déjà été terminée aujourd'hui (la série est sauvée pour la journée)
export function planNotifications({ now = new Date(), time = DEFAULT_TIME, dailyDone = false, streak = 0, completedToday = false, translate = t } = {}){
  const plan = [];
  const at = parseTime(time);
  const threshold = now.getTime() + 30000;
  for(let d = 0; d < PLAN_DAYS; d++){
    const when = atLocal(now, d, at);
    if(when.getTime() <= threshold) continue;
    if(d === 0 && dailyDone) continue;
    const body = d === 0 && streak > 0
      ? translate('notifDailyStreak', { count: streak })
      : translate('notifDaily');
    plan.push({ id: MORNING_ID_BASE + d, at: when, title: translate('notifTitle'), body });
  }
  // Rappel du soir : seulement aujourd'hui, seulement si la série est en jeu et pas encore sauvée.
  const evening = atLocal(now, 0, parseTime(EVENING_TIME));
  if(streak > 0 && !completedToday && at.hour < EVENING_MIN_GAP_HOUR && evening.getTime() > threshold){
    plan.push({ id: EVENING_ID, at: evening, title: translate('notifTitle'), body: translate('notifStreakRisk', { count: streak }) });
  }
  return plan;
}

async function loadPlugin(options){
  if(options.LocalNotifications) return options.LocalNotifications;
  return (await import('@capacitor/local-notifications')).LocalNotifications;
}

// Reprogramme (ou annule) les rappels selon les réglages. Ne lève jamais d'erreur.
// Renvoie 'unsupported' | 'disabled' | 'denied' | 'scheduled' | 'error'.
export async function syncNotifications(options = {}){
  const native = options.native ?? isNotificationSupported();
  if(!native) return 'unsupported';
  try{
    const LN = await loadPlugin(options);
    const prefs = getNotificationPrefs();
    const pending = await LN.getPending();
    if(pending?.notifications?.length){
      await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
    if(!prefs.enabled) return 'disabled';
    const permission = await LN.checkPermissions();
    if(permission?.display !== 'granted') return 'denied';
    const now = options.now || new Date();
    const streak = getAchievementStreakStatus(now);
    const plan = planNotifications({
      now,
      time: prefs.time,
      dailyDone: !!getTodayDailyRun(),
      streak: streak.count,
      completedToday: !!streak.completedToday
    });
    if(plan.length){
      await LN.schedule({
        notifications: plan.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true } }))
      });
    }
    return 'scheduled';
  }catch{
    return 'error';
  }
}

// Demande la permission puis active le rappel. Renvoie 'granted' | 'denied' | 'unsupported'.
export async function enableNotifications(options = {}){
  const native = options.native ?? isNotificationSupported();
  if(!native) return 'unsupported';
  saveNotificationPrefs({ asked: true });
  try{
    const LN = await loadPlugin(options);
    let permission = await LN.checkPermissions();
    if(permission?.display !== 'granted'){
      permission = await LN.requestPermissions();
    }
    if(permission?.display !== 'granted'){
      saveNotificationPrefs({ enabled: false });
      return 'denied';
    }
    saveNotificationPrefs({ enabled: true });
    await syncNotifications({ ...options, LocalNotifications: LN });
    return 'granted';
  }catch{
    saveNotificationPrefs({ enabled: false });
    return 'denied';
  }
}

export async function disableNotifications(options = {}){
  saveNotificationPrefs({ enabled: false, asked: true });
  return syncNotifications(options);
}

// Proposition affichée après le premier défi du jour terminé (une seule fois).
export function shouldOfferNotifications(mode){
  if(mode !== 'daily' || !isNotificationSupported()) return false;
  const prefs = getNotificationPrefs();
  return !prefs.asked && !prefs.enabled;
}

export function markNotificationsAsked(){
  saveNotificationPrefs({ asked: true });
}
