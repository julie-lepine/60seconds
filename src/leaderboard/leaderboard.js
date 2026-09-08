import { getUsername } from '../storage.js';

function publicEnv(name){
  try{
    const v = import.meta.env?.[name];
    if(v) return String(v);
  }catch{}
  try{
    if(typeof process !== 'undefined' && process.env?.[name]) return String(process.env[name]);
  }catch{}
  return '';
}

function configured(){
  return !!(publicEnv('VITE_SUPABASE_URL') && publicEnv('VITE_SUPABASE_ANON_KEY'));
}

function logDev(message, detail){
  try{
    if(import.meta.env?.DEV) console.warn('[leaderboard]', message, detail ?? '');
  }catch{}
}

export function localDailyDate(now = new Date()){
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function supabaseFetch(path, options = {}){
  const url = publicEnv('VITE_SUPABASE_URL').replace(/\/$/, '');
  const key = publicEnv('VITE_SUPABASE_ANON_KEY');
  if(!url || !key) return { ok: false, data: null, error: 'not-configured' };
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  let data = null;
  const text = await res.text();
  if(text){
    try{ data = JSON.parse(text); }catch{ data = text; }
  }
  if(!res.ok) return { ok: false, data: null, error: data?.message || res.statusText || 'request-failed' };
  return { ok: true, data, error: null };
}

export function buildLeaderboardRow(mode, score){
  const username = getUsername();
  if(!username) return null;
  const n = Number(score);
  if(!Number.isFinite(n) || n < 0) return null;
  const isDaily = mode === 'daily';
  return {
    username,
    score: Math.round(n),
    mode: isDaily ? 'daily' : 'normal',
    daily_date: isDaily ? localDailyDate() : null
  };
}

export async function submitLeaderboardScore(mode, score){
  try{
    if(!configured()) return null;
    const row = buildLeaderboardRow(mode, score);
    if(!row) return null;
    const { ok, error } = await supabaseFetch('leaderboard', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    });
    if(!ok){ logDev('submit failed', error); return null; }
    return row;
  }catch(err){
    logDev('submit failed', err);
    return null;
  }
}

export async function getLeaderboard(mode, dailyDate){
  try{
    if(!configured()) return [];
    const isDaily = mode === 'daily';
    const params = new URLSearchParams();
    params.set('select', 'id,username,score,mode,daily_date,created_at');
    params.set('mode', `eq.${isDaily ? 'daily' : 'normal'}`);
    if(isDaily) params.set('daily_date', `eq.${dailyDate || localDailyDate()}`);
    else params.set('daily_date', 'is.null');
    params.set('order', 'score.desc,created_at.asc');
    params.set('limit', '50');
    const { ok, data, error } = await supabaseFetch(`leaderboard?${params.toString()}`, { method: 'GET' });
    if(!ok){ logDev('fetch failed', error); return []; }
    return Array.isArray(data) ? data : [];
  }catch(err){
    logDev('fetch failed', err);
    return [];
  }
}
