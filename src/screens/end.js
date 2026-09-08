import { G } from '../state.js';
import { fmt, clearGameTimers } from '../utils.js';
import { sImpact } from '../audio.js';
import { startCountdown } from './countdown.js';
import { renderHome } from './home.js';

const app = document.getElementById('app');

export function endGame(){
  clearGameTimers();
  G.screen='end';
  app.innerHTML = `<div class="screen" id="screen-end"></div>`;
  sImpact();
  setTimeout(()=>{
    const isNew = G.score>G.best;
    const delta = G.score-G.best;
    const el=document.getElementById('screen-end');
    el.innerHTML = `
      <div class="end-label label">SCORE</div>
      <div class="end-score display" id="scoreNum">0</div>
      <div class="end-delta ui" id="deltaLine">${isNew?'NOUVEAU RECORD':(G.best>0?`${delta>=0?'+':''}${fmt(delta)} VS TON RECORD`:'PREMIER SCORE')}</div>
      <button class="again-btn" id="againBtn">REJOUER</button>
      <div class="home-link" id="homeLink">ACCUEIL</div>`;
    if(isNew) el.querySelector('#deltaLine').classList.add('new');
    if(G.score>G.best) G.best=G.score;
    animateScore(document.getElementById('scoreNum'), G.score, ()=>{
      document.getElementById('deltaLine').classList.add('show');
      setTimeout(()=>{
        document.getElementById('againBtn').classList.add('show');
        document.getElementById('homeLink').classList.add('show');
      },250);
    });
    document.getElementById('againBtn').onclick=()=>startCountdown(G.mode);
    document.getElementById('homeLink').onclick=renderHome;
  }, 650);
}
function animateScore(el, target, done){
  const dur=900; const t0=performance.now();
  function step(){
    const p=Math.min(1,(performance.now()-t0)/dur);
    const eased=1-Math.pow(1-p,3);
    el.textContent=fmt(target*eased);
    if(p<1) requestAnimationFrame(step); else { el.textContent=fmt(target); done&&done(); }
  }
  step();
}
