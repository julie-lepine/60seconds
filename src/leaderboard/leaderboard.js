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
    console.warn('[leaderboard]', message, detail ?? '');
  }catch{}
}

export function localDailyDate(now = new Date()){
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
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

function normalizeMode(mode){
  return mode === 'daily' || mode === 'hardcore' ? mode : 'normal';
}

function boardArgs(mode, dailyDate){
  const isDaily = mode === 'daily';
  return {
    p_mode: normalizeMode(mode),
    p_daily_date: isDaily ? (dailyDate || localDailyDate()) : null
  };
}

export function buildLeaderboardRow(mode, score, streak){
  const username = getUsername();
  if(!username) return null;
  const n = Number(score);
  if(!Number.isFinite(n) || n < 0) return null;
  const isDaily = mode === 'daily';
  const row = {
    username,
    score: Math.round(n),
    mode: normalizeMode(mode),
    daily_date: isDaily ? localDailyDate() : null
  };
  // Série en cours (badge du classement). Absente si 0 ou inconnue.
  const days = Math.floor(Number(streak));
  if(Number.isFinite(days) && days > 0) row.streak = Math.min(days, 10000);
  return row;
}

export async function submitLeaderboardScore(mode, score, streak){
  try{
    if(!configured()){
      logDev('submit skipped', 'not-configured');
      return null;
    }
    const row = buildLeaderboardRow(mode, score, streak);
    if(!row) return null;
    const send = body => supabaseFetch('leaderboard', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(body)
    });
    let result = await send(row);
    if(!result.ok && row.streak != null && result.status === 400){
      // Colonne « streak » pas encore créée (migration 006) : le score ne doit jamais se perdre.
      const { streak: _ignored, ...plain } = row;
      result = await send(plain);
      if(result.ok) return plain;
    }
    if(!result.ok){ logDev('submit failed', result.error); return null; }
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

function normalizePeriod(period){
  return period === 'month' ? 'month' : 'all';
}

// Top 10 + voisins du joueur + total de joueurs classés (une ligne par joueur).
// Renvoie { error } si la fonction SQL est absente (migration 005 non exécutée) :
// l'écran retombe alors sur l'ancien classement.
export async function getBoard(mode, period, dailyDate){
  try{
    if(!configured()) return { rows: [], total: 0, error: 'not-configured' };
    const { ok, data, error } = await supabaseFetch('rpc/leaderboard_board', {
      method: 'POST',
      body: JSON.stringify({
        ...boardArgs(mode, dailyDate),
        p_period: normalizePeriod(period),
        p_username: getUsername() || null,
        p_top: 10,
        p_around: 1
      })
    });
    if(!ok){ logDev('board failed', error); return { rows: [], total: 0, error: error || 'request-failed' }; }
    const rows = (Array.isArray(data) ? data : [])
      .map(r => ({
        rank: Number(r.rank),
        username: String(r.username ?? ''),
        score: Number(r.score),
        total: Number(r.total),
        streak: Number.isFinite(Number(r.streak)) && Number(r.streak) > 0 ? Number(r.streak) : 0
      }))
      .filter(r => Number.isFinite(r.rank) && r.rank >= 1 && Number.isFinite(r.score));
    return { rows, total: rows.length ? rows[0].total : 0, error: null };
  }catch(err){
    logDev('board failed', err);
    return { rows: [], total: 0, error: 'request-failed' };
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
