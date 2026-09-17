import { CHALLENGE_TYPES } from '../constants.js';

export function mulberry32(a){ return function(){ a|=0;a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function seedFromDate(){
  const d=new Date();
  return d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
}
export function makeDailyPicker(){
  const rnd = mulberry32(seedFromDate());
  let last = null;
  return function pick(){
    let t;
    do{ t=CHALLENGE_TYPES[Math.floor(rnd()*CHALLENGE_TYPES.length)]; }
    while(CHALLENGE_TYPES.length>1 && t===last);
    last=t;
    return t;
  };
}
