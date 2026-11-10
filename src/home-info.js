// Infos de l'accueil : temps avant le prochain défi, rang du jour et rang général. Fonctions pures.
import { topPercent } from './leaderboard/board-layout.js';

// Le défi du jour change à minuit UTC (même règle que localDailyDate du classement).
export function formatNextDaily(now = new Date()){
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const ms = Math.max(0, next - now.getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

// Cherche le joueur dans les lignes renvoyées par getBoard.
export function findMyRank(rows, username){
  if(!username || !Array.isArray(rows)) return null;
  const me = rows.find(r => r.username === username);
  if(!me) return null;
  return { rank: me.rank, total: me.total, percent: topPercent(me.rank, me.total) };
}

export function generalRankText(info){
  if(!info) return '—';
  return info.percent ? `TOP ${info.percent} %` : `#${info.rank}`;
}

export function dailyCaptionText(info, nextText){
  if(!info) return nextText;
  const rank = `#${info.rank}${info.percent ? ` · TOP ${info.percent} %` : ''}`;
  return `${rank} · ${nextText}`;
}
