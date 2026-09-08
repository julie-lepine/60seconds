import { G } from '../state.js';
import { fmt, clearGameTimers } from '../utils.js';
import { sImpact } from '../audio.js';
import { saveBestScore, saveTodayDailyRun } from '../storage.js';
import { submitLeaderboardScore } from '../leaderboard/leaderboard.js';
import { startCountdown } from './countdown.js';
import { renderHome } from './home.js';

const app = document.getElementById('app');

export function endGame(){
  clearGameTimers();
  G.screen='end';
  const isNew = G.score>G.best;
  const delta = G.score-G.best;
  const previousBest = G.best;
  if(isNew){ G.best=G.score; saveBestScore(G.mode, G.score); }
  if(G.mode==='daily') saveTodayDailyRun(G.score);
  submitLeaderboardScore(G.mode, G.score);
  app.innerHTML = `<div class="screen" id="screen-end"></div>`;
  sImpact();
  setTimeout(()=>{
    const el=document.getElementById('screen-end');
    if(!el) return;
    el.innerHTML = `
      <div class="end-label label">SCORE</div>
      <div class="end-score display" id="scoreNum">0</div>
      <div class="end-delta ui" id="deltaLine">${isNew?'NOUVEAU RECORD':(previousBest>0?`${delta>=0?'+':''}${fmt(delta)} VS TON RECORD`:'PREMIER SCORE')}</div>
      <button class="again-btn" id="againBtn">REJOUER</button>
      <div class="home-link" id="homeLink">ACCUEIL</div>`;
    if(isNew) el.querySelector('#deltaLine').classList.add('new');
    const scoreEl=document.getElementById('scoreNum');
    if(G.reduceMotion){
      if(scoreEl) scoreEl.textContent=fmt(G.score);
      document.getElementById('deltaLine')?.classList.add('show');
      document.getElementById('againBtn')?.classList.add('show');
      document.getElementById('homeLink')?.classList.add('show');
    }else{
      animateScore(scoreEl, G.score, ()=>{
        document.getElementById('deltaLine')?.classList.add('show');
        setTimeout(()=>{
          document.getElementById('againBtn')?.classList.add('show');
          document.getElementById('homeLink')?.classList.add('show');
        },250);
      });
    }
    document.getElementById('againBtn').onclick=()=>startCountdown(G.mode);
    document.getElementById('homeLink').onclick=renderHome;
    if(G.mode==='daily'){
      document.getElementById('againBtn')?.remove();
    }
  }, 650);
}
function animateScore(el, target, done){
  if(!el){ done&&done(); return; }
  const dur=900; const t0=performance.now();
  function step(){
    if(!document.body.contains(el)){ done&&done(); return; }
    const p=Math.min(1,(performance.now()-t0)/dur);
    const eased=1-Math.pow(1-p,3);
    el.textContent=fmt(target*eased);
    if(p<1) requestAnimationFrame(step); else { el.textContent=fmt(target); done&&done(); }
  }
  step();
}
