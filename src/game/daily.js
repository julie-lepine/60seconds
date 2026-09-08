import { CHALLENGE_TYPES } from '../constants.js';

export function mulberry32(a){ return function(){ a|=0;a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function seedFromDate(){ const d=new Date(); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); }
export function buildDailySeq(){
  const rnd = mulberry32(seedFromDate());
  const seq=[];
  for(let i=0;i<24;i++){ seq.push(CHALLENGE_TYPES[Math.floor(rnd()*CHALLENGE_TYPES.length)]); }
  return seq;
}
