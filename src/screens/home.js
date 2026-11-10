import { t } from '../i18n.js';
import { G } from '../state.js';
import { fmt, setHardcoreTheme } from '../utils.js';
import { ctx } from '../audio.js';
import { getRecordScore, getTodayDailyRun, getBestScore, getUsername } from '../storage.js';
import { getBoard } from '../leaderboard/leaderboard.js';
import { formatNextDaily, findMyRank, generalRankText, dailyCaptionText } from '../home-info.js';
import { getAchievementStreakStatus } from '../achievements/storage.js';
import { view } from '../dom.js';
import { flameHtml, snowflakeSvg } from '../streak.js';
import { startCountdown } from './countdown.js';
import { renderScores } from './scores.js';
import { renderSettings } from './settings.js';
import { renderAchievements } from './achievements.js';

// Rangs affichés sur l'accueil : un appel réseau au plus toutes les 60 s, échec silencieux.
const RANK_TTL_MS = 60000;
let rankCache = { at: 0, dailyDone: null, general: null, daily: null };

async function fillRanks(dailyDone){
  try{
    const username = getUsername();
    if(!username) return;
    if(Date.now() - rankCache.at > RANK_TTL_MS || rankCache.dailyDone !== dailyDone){
      const [general, daily] = await Promise.all([
        getBoard('normal', 'all'),
        dailyDone ? getBoard('daily', 'all') : Promise.resolve(null)
      ]);
      rankCache = {
        at: Date.now(),
        dailyDone,
        general: general && !general.error ? findMyRank(general.rows, username) : null,
        daily: daily && !daily.error ? findMyRank(daily.rows, username) : null
      };
    }
    if(G.screen !== 'home') return;
    const rankEl = document.getElementById('homeRank');
    if(rankEl) rankEl.textContent = generalRankText(rankCache.general);
    const caption = document.getElementById('dailyCaption');
    if(caption && dailyDone){
      caption.textContent = dailyCaptionText(rankCache.daily, t('dailyNext', { time: formatNextDaily() }));
    }
  }catch{}
}

export function renderHome(){
  G.screen='home';
  setHardcoreTheme(false);
  G.best = getRecordScore();
  const dailyRun = getTodayDailyRun();
  const streak = getAchievementStreakStatus();
  const hardcoreBest = getBestScore('hardcore');
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
      <div class="daily-wrap">
        ${dailyRun
          ? `<div class="daily-link done"><span class="daily-check" aria-hidden="true">✓</span><span class="daily-done-label">${t('dailyDone')}</span><b class="daily-score">${fmt(dailyRun.score)}</b></div>`
          : `<button class="daily-link todo tap-safe" id="dailyBtn"><span class="daily-dot" aria-hidden="true"></span>${t('daily')}</button>`}
        <div class="daily-caption ui" id="dailyCaption">${dailyRun ? t('dailyNext', { time: formatNextDaily() }) : t('dailyHint')}</div>
      </div>
      <button class="play-btn tap-safe" id="playBtn">${t('modeClassic')}</button>
      <button class="hardcore-link tap-safe" id="hardcoreBtn"><span class="hardcore-dot" aria-hidden="true"></span><span class="hc-label">${t('modeHardcore')}</span>${hardcoreBest > 0 ? `<span class="hc-best">${fmt(hardcoreBest)}</span>` : ''}</button>
      <div class="home-stats">
        <div class="home-stat home-stat-streak">
          <div class="home-stat-label">${t('streak')}${streak.freezes > 0 ? `<span class="freeze-chip" title="${t('freezeLabel')}" aria-label="${t('freezeLabel')} ${streak.freezes}">${snowflakeSvg}${streak.freezes}</span>` : ''}</div>
          <div class="home-stat-value">${flameHtml(streak.count)}${streakText}</div>
        </div>
        <div class="home-stat-divider" aria-hidden="true"></div>
        <div class="home-stat">
          <div class="home-stat-label">${t('record')}</div>
          <div class="home-stat-value">${fmt(G.best)}</div>
        </div>
        <div class="home-stat-divider" aria-hidden="true"></div>
        <div class="home-stat">
          <div class="home-stat-label">${t('rankLabel')}</div>
          <div class="home-stat-value" id="homeRank">${generalRankText(rankCache.general)}</div>
        </div>
      </div>
    </div>`;
  document.getElementById('playBtn').onclick=()=>{ ctx(); startCountdown('normal'); };
  document.getElementById('dailyBtn')?.addEventListener('click', ()=>{ ctx(); startCountdown('daily'); });
  document.getElementById('hardcoreBtn').onclick=()=>{ ctx(); startCountdown('hardcore'); };
  document.getElementById('nav-scores').onclick=renderScores;
  document.getElementById('nav-achievements').onclick=renderAchievements;
  document.getElementById('nav-settings').onclick=renderSettings;
  void fillRanks(!!dailyRun);
}
