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
  if(!url || !key) return { ok: false, status: 0, data: null, error: 'not-configured' };
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
  const contentRange = res.headers.get('content-range');
  if(!res.ok && res.status !== 416) return { ok: false, status: res.status, data: null, error: data?.message || res.statusText || 'request-failed', contentRange };
  return { ok: true, status: res.status, data, error: null, contentRange };
}

function boardArgs(mode, dailyDate){
  const isDaily = mode === 'daily';
  return {
    p_mode: isDaily ? 'daily' : 'normal',
    p_daily_date: isDaily ? (dailyDate || localDailyDate()) : null
  };
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
    if(!configured()) return { rows: [], error: 'not-configured' };
    const { ok, data, error } = await supabaseFetch('rpc/leaderboard_top', {
      method: 'POST',
      body: JSON.stringify({ ...boardArgs(mode, dailyDate), p_limit: 50 })
    });
    if(!ok){ logDev('fetch failed', error); return { rows: [], error: error || 'request-failed' }; }
    return { rows: Array.isArray(data) ? data : [], error: null };
  }catch(err){
    logDev('fetch failed', err);
    return { rows: [], error: 'request-failed' };
  }
}

export async function getPlayerRank(mode, dailyDate){
  try{
    const username = getUsername();
    if(!configured() || !username) return null;
    const { ok, data, error } = await supabaseFetch('rpc/leaderboard_player_rank', {
      method: 'POST',
      body: JSON.stringify({ ...boardArgs(mode, dailyDate), p_username: username })
    });
    if(!ok){ logDev('rank failed', error); return null; }
    const row = Array.isArray(data) ? data[0] : null;
    if(!row) return null;
    const score = Number(row.score);
    const rank = Number(row.rank);
    if(!Number.isFinite(score) || !Number.isFinite(rank) || rank < 1) return null;
    return { score, rank };
  }catch(err){
    logDev('rank failed', err);
    return null;
  }
}
