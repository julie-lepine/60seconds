const KEYS = {
  normal: '60seconds_best_normal',
  daily: '60seconds_best_daily'
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
