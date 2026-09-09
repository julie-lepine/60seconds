import { t } from '../i18n.js';
import { G } from '../state.js';
import { CHALLENGE_TYPES } from '../constants.js';
import { ri, clearGameTimers } from '../utils.js';
import { sInsane, sSuccess, sError } from '../audio.js';
import { endGame } from '../screens/end.js';
import { CHALLENGES } from '../challenges/challenges.js';

export function pickType(){
  if(G.mode==='daily'){ const t=G.dailySeq[G.dailyIdx % G.dailySeq.length]; G.dailyIdx++; return t; }
  let t; do{ t=CHALLENGE_TYPES[ri(0,CHALLENGE_TYPES.length-1)]; }while(t===G.lastType);
  G.lastType=t; return t;
}
export function nextChallenge(){
  if(performance.now()>=G.endTime) return;
  const area=document.getElementById('challengeArea');
  if(!area) return;
  area.style.background=''; area.innerHTML='';
  CHALLENGES[pickType()](area);
}
export function resultFlash(kind, points, cb){
  G.score += points;
  const area=document.getElementById('challengeArea');
  if(!area) return;
  const text = kind==='insane'?t('flashInsane'):(kind==='good'?t('flashGood'):t('flashBad'));
  area.style.background='';
  area.innerHTML = `<div class="feedback display ${kind==='insane'?'insane':(kind==='good'?'good':'bad')}">${text}</div>`;
  if(kind==='insane') sInsane(); else if(kind==='good') sSuccess(); else sError();
  clearGameTimers.chal=null;
  setTimeout(()=>{ if(performance.now()<G.endTime) nextChallenge(); else endGame(); }, kind==='bad'?420:500);
}
