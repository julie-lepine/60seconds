const KEYS = {
  normal: '60seconds_best_normal',
  daily: '60seconds_best_daily',
  username: '60seconds_username'
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
