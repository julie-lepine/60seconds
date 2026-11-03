import { G } from './state.js';

export function fmt(n){ return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'\u202F'); }
export function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
// En mode quotidien, G.rng est un générateur à graine (voir game/daily.js) :
// tous les joueurs voient exactement les mêmes valeurs. Sinon, Math.random.
export function rnd(){ return (G.rng || Math.random)(); }
export function rand(min,max){ return rnd()*(max-min)+min; }
// Mélange de Fisher-Yates, reproductible quand G.rng est défini.
export function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
export function ri(min,max){ return Math.floor(rand(min,max+1)); }
// Thème HARDCORE : palette inversée (fond noir, détails crème / corail).
export function setHardcoreTheme(on){
  try{ document.documentElement.classList.toggle('hardcore', !!on); }catch{}
}
export function clearChallengeTimers(){
  clearTimeout(G.chalTimeout); G.chalTimeout=null;
  clearTimeout(G.reactionTimer); G.reactionTimer=null;
  clearTimeout(G.memTimer); G.memTimer=null;
  clearTimeout(G.flashTimeout); G.flashTimeout=null;
  clearInterval(G.timingInterval); G.timingInterval=null;
  G.flashLock=false;
}
export function clearGameTimers(){
  cancelAnimationFrame(G.raf);
  G.raf=null;
  clearChallengeTimers();
}
