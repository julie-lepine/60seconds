import { t } from '../i18n.js';
import { G } from '../state.js';
import { CHALLENGE_TYPES, HARDCORE_PENALTY_STEP } from '../constants.js';
import { ri, fmt, clearChallengeTimers } from '../utils.js';
import { makeDailyRng } from './daily.js';
import { sInsane, sSuccess, sError } from '../audio.js';
import { endGame } from '../screens/end.js';
import { CHALLENGES } from '../challenges/challenges.js';
import { markChallengeShown, recordChallengeResult, markScoreFloorReached } from '../achievements/session.js';

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
  G.rng = G.mode==='daily' ? makeDailyRng(G.dailyIndex++) : null;
  const eventContext=markChallengeShown(type);
  CHALLENGES[type](area, eventContext);
}
// HARDCORE : chaque erreur (ou temps écoulé) retire des points, sans descendre sous 0.
// La pénalité grimpe de 50 en 50 pour des erreurs consécutives (errorStreak = erreurs d'affilée avant celle-ci).
export function hardcorePenalty(errorStreak = 0){
  return HARDCORE_PENALTY_STEP * (Math.max(0, errorStreak) + 1);
}
export function applyResultScore(score, kind, points, mode, errorStreak = 0){
  if(mode==='hardcore' && kind==='bad') return Math.max(0, score - hardcorePenalty(errorStreak));
  return score + points;
}
export function resultFlash(kind, points, eventContext, metadata){
  if(G.screen!=='gameplay') return;
  if(G.flashLock) return;
  const area=document.getElementById('challengeArea');
  if(!area) return;
  if(!recordChallengeResult(eventContext, kind, metadata)) return;
  G.flashLock=true;
  const before=G.score;
  G.score = applyResultScore(G.score, kind, points, G.mode, G.hcErrorStreak || 0);
  G.hcErrorStreak = kind==='bad' ? (G.hcErrorStreak || 0) + 1 : 0;
  const lost=Math.max(0, before-G.score);
  if(lost>0 && G.score===0) markScoreFloorReached();
  const hcScore=document.getElementById('hcScore');
  if(hcScore) hcScore.textContent=fmt(G.score);
  const text = kind==='insane'?t('flashInsane'):(kind==='good'?t('flashGood'):t('flashBad'));
  const penalty = lost>0 ? `<div class="feedback-penalty display">\u2212${fmt(lost)}</div>` : '';
  area.style.background='';
  area.innerHTML = `<div class="feedback display ${kind==='insane'?'insane':(kind==='good'?'good':'bad')}">${text}${penalty}</div>`;
  if(kind==='insane') sInsane(); else if(kind==='good') sSuccess(); else sError();
  clearTimeout(G.flashTimeout);
  G.flashTimeout=setTimeout(()=>{
    G.flashTimeout=null;
    G.flashLock=false;
    if(performance.now()<G.endTime) nextChallenge(); else endGame();
  }, kind==='bad'?420:500);
}
