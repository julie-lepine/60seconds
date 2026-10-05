import { t } from '../i18n.js';
import { G } from '../state.js';
import { fmt } from '../utils.js';
import { ctx } from '../audio.js';
import { getBestScore, getTodayDailyRun } from '../storage.js';
import { getAchievementStreakStatus } from '../achievements/storage.js';
import { view } from '../dom.js';
import { startCountdown } from './countdown.js';
import { renderScores } from './scores.js';
import { renderSettings } from './settings.js';
import { renderAchievements } from './achievements.js';

export function renderHome(){
  G.screen='home';
  G.best = getBestScore('normal');
  const dailyRun = getTodayDailyRun();
  const streak = getAchievementStreakStatus();
  const streakText = t(streak.count === 1 ? 'streakDay' : 'streakDays', { count: fmt(streak.count) });
  view.innerHTML = `
    <div class="screen" id="screen-home">
      <div class="topnav home-topnav">
        <div class="navlink" id="nav-scores">${t('navScores')}</div>
        <div class="navlink" id="nav-achievements">${t('achievements')}</div>
        <div class="navlink" id="nav-settings">${t('navSettings')}</div>
      </div>
      <div class="home-logo">
        <div class="home-num display">60</div>
        <div class="home-word">${t('seconds')}</div>
      </div>
      <button class="play-btn tap-safe" id="playBtn">${t('play')}</button>
      ${dailyRun
        ? `<div class="daily-link done"><span class="daily-check" aria-hidden="true">✓</span><span class="daily-done-label">${t('dailyDone')}</span><b class="daily-score">${fmt(dailyRun.score)}</b></div>`
        : `<button class="daily-link tap-safe" id="dailyBtn"><span class="daily-dot" aria-hidden="true"></span>${t('daily')}</button>`}
      <div class="home-stats">
        <div class="home-stat">
          <div class="home-stat-label">${t('streak')}</div>
          <div class="home-stat-value"><span class="streak-flame" aria-hidden="true"></span>${streakText}</div>
        </div>
        <div class="home-stat-divider" aria-hidden="true"></div>
        <div class="home-stat">
          <div class="home-stat-label">${t('record')}</div>
          <div class="home-stat-value">${fmt(G.best)}</div>
        </div>
      </div>
    </div>`;
  document.getElementById('playBtn').onclick=()=>{ ctx(); startCountdown('normal'); };
  document.getElementById('dailyBtn')?.addEventListener('click', ()=>{ ctx(); startCountdown('daily'); });
  document.getElementById('nav-scores').onclick=renderScores;
  document.getElementById('nav-achievements').onclick=renderAchievements;
  document.getElementById('nav-settings').onclick=renderSettings;
}
