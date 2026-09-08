import { G } from './state.js';

export function fmt(n){ return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'\u202F'); }
export function rand(min,max){ return Math.random()*(max-min)+min; }
export function ri(min,max){ return Math.floor(rand(min,max+1)); }
export function clearGameTimers(){
  cancelAnimationFrame(G.raf);
  clearTimeout(G.chalTimeout); clearTimeout(G.reactionTimer); clearTimeout(G.memTimer); clearTimeout(G.tapTimer);
  clearInterval(G.timingInterval);
}
