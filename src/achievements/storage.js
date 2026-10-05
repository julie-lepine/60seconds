import { Preferences } from '@capacitor/preferences';
import { getBestScore, getTodayDailyRun } from '../storage.js';
import {
  createEmptyProgress,
  getEffectiveStreak,
  migrateLegacyProgress,
  normalizeProgress
} from './progress.js';

export const PROGRESS_STORAGE_KEY = '60seconds_progress';

const LEGACY_STREAK_KEYS = ['60seconds_streak_v1', '60seconds_streak'];

let progressCache = createEmptyProgress();
let initialized = false;
let writable = true;
let storageStatus = 'uninitialized';
let writeQueue = Promise.resolve();

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

async function readRaw(key){
  try{
    const { value } = await Preferences.get({ key });
    if(value != null) return value;
  }catch{}
  try{ return localStorage.getItem(key); }catch{ return null; }
}

async function writeRaw(key, value){
  try{
    await Preferences.set({ key, value });
    return true;
  }catch{
    try{
      localStorage.setItem(key, value);
      return true;
    }catch{
      return false;
    }
  }
}

function parseJson(raw){
  if(typeof raw !== 'string' || !raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}

async function readLegacyStreak(){
  for(const key of LEGACY_STREAK_KEYS){
    const data = parseJson(await readRaw(key));
    if(data && typeof data === 'object') return data;
  }
  return null;
}

async function legacySources(){
  return {
    normalBest: getBestScore('normal'),
    dailyBest: getBestScore('daily'),
    streak: await readLegacyStreak(),
    dailyRun: getTodayDailyRun()
  };
}

async function replaceProgress(nextProgress){
  if(!writable) return false;
  const normalized = normalizeProgress(nextProgress);
  if(normalized.status !== 'valid') return false;
  const serialized = JSON.stringify(normalized.progress);
  const operation = writeQueue.then(() => writeRaw(PROGRESS_STORAGE_KEY, serialized));
  writeQueue = operation.catch(() => false);
  const saved = await operation;
  if(saved) progressCache = normalized.progress;
  return saved;
}

export async function initializeAchievementProgress(now = new Date()){
  if(initialized){
    return { progress: clone(progressCache), status: storageStatus, writable };
  }

  const raw = await readRaw(PROGRESS_STORAGE_KEY);
  if(raw != null){
    const parsed = parseJson(raw);
    const normalized = normalizeProgress(parsed);
    if(normalized.status === 'valid'){
      progressCache = normalized.progress;
      initialized = true;
      storageStatus = 'loaded';
      return { progress: clone(progressCache), status: storageStatus, writable };
    }
    if(normalized.status === 'future'){
      progressCache = createEmptyProgress(now.toISOString());
      initialized = true;
      writable = false;
      storageStatus = 'future-version';
      return { progress: clone(progressCache), status: storageStatus, writable };
    }
    storageStatus = 'recovered-invalid';
  }else{
    storageStatus = 'migrated';
  }

  progressCache = migrateLegacyProgress(await legacySources(), now.toISOString());
  initialized = true;
  await replaceProgress(progressCache);
  return { progress: clone(progressCache), status: storageStatus, writable };
}

export function getAchievementProgress(){
  return clone(progressCache);
}

export function getAchievementStreakStatus(now = new Date()){
  return getEffectiveStreak(progressCache, now);
}

export async function persistAchievementProgress(nextProgress){
  if(!initialized) await initializeAchievementProgress();
  return replaceProgress(nextProgress);
}

export function getAchievementStorageStatus(){
  return { initialized, writable, status: storageStatus };
}

export function resetAchievementStorageForTests(){
  progressCache = createEmptyProgress();
  initialized = false;
  writable = true;
  storageStatus = 'uninitialized';
  writeQueue = Promise.resolve();
}
