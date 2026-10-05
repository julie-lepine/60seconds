import { t } from '../i18n.js';
import { G } from '../state.js';
import { CHALLENGE_TYPES } from '../constants.js';
import { ri, clearChallengeTimers } from '../utils.js';
import { sInsane, sSuccess, sError } from '../audio.js';
import { endGame } from '../screens/end.js';
import { CHALLENGES } from '../challenges/challenges.js';
import { markChallengeShown, recordChallengeResult } from '../achievements/session.js';

export function pickType(){
  if(G.mode==='daily' && G.dailyPick) return G.dailyPick();
  let t; do{ t=CHALLENGE_TYPES[ri(0,CHALLENGE_TYPES.length-1)]; }while(t===G.lastType);
  G.lastType=t; return t;
}
export function nextChallenge(){
  if(performance.now()>=G.endTime) return;
  const area=document.getElementById('challengeArea');
  if(!area) return;
  clearChallengeTimers();
  area.style.background=''; area.innerHTML='';
  const type=pickType();
  const eventContext=markChallengeShown(type);
  CHALLENGES[type](area, eventContext);
}
export function resultFlash(kind, points, eventContext, metadata){
  if(G.screen!=='gameplay') return;
  if(G.flashLock) return;
  const area=document.getElementById('challengeArea');
  if(!area) return;
  if(!recordChallengeResult(eventContext, kind, metadata)) return;
  G.flashLock=true;
  G.score += points;
  const text = kind==='insane'?t('flashInsane'):(kind==='good'?t('flashGood'):t('flashBad'));
  area.style.background='';
  area.innerHTML = `<div class="feedback display ${kind==='insane'?'insane':(kind==='good'?'good':'bad')}">${text}</div>`;
  if(kind==='insane') sInsane(); else if(kind==='good') sSuccess(); else sError();
  clearTimeout(G.flashTimeout);
  G.flashTimeout=setTimeout(()=>{
    G.flashTimeout=null;
    G.flashLock=false;
    if(performance.now()<G.endTime) nextChallenge(); else endGame();
  }, kind==='bad'?420:500);
}
