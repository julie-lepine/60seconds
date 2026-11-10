// Mise en page du classement : top 10, séparateur, puis « autour de toi ».
// Fonctions pures (testables sans DOM).

export const MIN_PLAYERS_FOR_PERCENT = 20;

// Rang en pourcentage : « top 12 % ». Jamais 0 %. Masqué si trop peu de joueurs.
export function topPercent(rank, total){
  const r = Number(rank), n = Number(total);
  if(!Number.isFinite(r) || !Number.isFinite(n) || r < 1 || n < MIN_PLAYERS_FOR_PERCENT || r > n) return null;
  return Math.max(1, Math.ceil((r * 100) / n));
}

// rows : lignes triées par rang renvoyées par getBoard. Insère un séparateur quand
// il manque des rangs entre deux lignes consécutives.
export function buildBoardLayout(rows, username){
  const items = [];
  let previous = 0;
  let me = null;
  for(const r of rows){
    if(previous && r.rank > previous + 1) items.push({ type: 'gap' });
    const isMe = !!username && r.username === username;
    items.push({ type: 'row', rank: r.rank, name: r.username, score: r.score, me: isMe, streak: r.streak || 0 });
    if(isMe) me = { rank: r.rank, score: r.score, total: r.total, percent: topPercent(r.rank, r.total) };
    previous = r.rank;
  }
  return { items, me };
}
