import { t } from '../i18n.js';
import { G } from '../state.js';
import { fmt } from '../utils.js';
import { ctx } from '../audio.js';
import { getBestScore, getTodayDailyRun } from '../storage.js';
import { view } from '../dom.js';
import { startCountdown } from './countdown.js';
import { renderScores } from './scores.js';
import { renderSettings } from './settings.js';

export function renderHome(){
  G.screen='home';
  G.best = getBestScore('normal');
  const dailyRun = getTodayDailyRun();
  view.innerHTML = `
    <div class="screen" id="screen-home">
      <div class="topnav">
        <div class="navlink" id="nav-scores">${t('navScores')}</div>
        <div class="navlink" id="nav-settings">${t('navSettings')}</div>
      </div>
      <div class="home-logo">
        <div class="home-num display">60</div>
        <div class="home-word">${t('seconds')}</div>
      </div>
      <button class="play-btn tap-safe" id="playBtn">${t('play')}</button>
      ${dailyRun
        ? `<div class="daily-link done">${t('dailyDone', { score: fmt(dailyRun.score) })}</div>`
        : `<div class="daily-link" id="dailyBtn"><span class="daily-dot"></span>${t('daily')}</div>`}
      <div class="best-line">${t('record')}&nbsp; <b>${fmt(G.best)}</b></div>
    </div>`;
  document.getElementById('playBtn').onclick=()=>{ ctx(); startCountdown('normal'); };
  document.getElementById('dailyBtn')?.addEventListener('click', ()=>{ ctx(); startCountdown('daily'); });
  document.getElementById('nav-scores').onclick=renderScores;
  document.getElementById('nav-settings').onclick=renderSettings;
}
