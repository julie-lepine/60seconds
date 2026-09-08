import { G } from '../state.js';
import { fmt } from '../utils.js';
import { ctx } from '../audio.js';
import { getBestScore, getTodayDailyRun } from '../storage.js';
import { startCountdown } from './countdown.js';
import { renderScores } from './scores.js';
import { renderSettings } from './settings.js';

const app = document.getElementById('app');

export function renderHome(){
  G.screen='home';
  G.best = getBestScore('normal');
  const dailyRun = getTodayDailyRun();
  app.innerHTML = `
    <div class="screen" id="screen-home">
      <div class="topnav">
        <div class="navlink" id="nav-scores">SCORES</div>
        <div class="navlink" id="nav-settings">RÉGLAGES</div>
      </div>
      <div class="home-logo">
        <div class="home-num display">60</div>
        <div class="home-word">SECONDES</div>
      </div>
      <button class="play-btn tap-safe" id="playBtn">JOUER</button>
      ${dailyRun
        ? `<div class="daily-link done">SCORE DU 60 DU JOUR&nbsp;:&nbsp;<b>${fmt(dailyRun.score)}</b></div>`
        : `<div class="daily-link" id="dailyBtn"><span class="daily-dot"></span>LES 60 DU JOUR</div>`}
      <div class="best-line">RECORD&nbsp; <b>${fmt(G.best)}</b></div>
    </div>`;
  document.getElementById('playBtn').onclick=()=>{ ctx(); startCountdown('normal'); };
  document.getElementById('dailyBtn')?.addEventListener('click', ()=>{ ctx(); startCountdown('daily'); });
  document.getElementById('nav-scores').onclick=renderScores;
  document.getElementById('nav-settings').onclick=renderSettings;
}
