import { G } from './state.js';

export function fmt(n){ return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'\u202F'); }
export function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
export function rand(min,max){ return Math.random()*(max-min)+min; }
export function ri(min,max){ return Math.floor(rand(min,max+1)); }
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
