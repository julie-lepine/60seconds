import { t } from '../i18n.js';
import { G } from '../state.js';
import { makeDailyPicker } from '../game/daily.js';
import { nextChallenge } from '../game/engine.js';
import { tickTimer } from '../game/timer.js';
import { view } from '../dom.js';
import { clearGameTimers } from '../utils.js';

export function startPlay(){
  if(G.screen==='gameplay') return;
  clearGameTimers();
  G.screen='gameplay'; G.score=0; G.lastSecMark=null; G.lastType=null;
  G.dailyPick = G.mode==='daily' ? makeDailyPicker() : null;
  G.endTime = performance.now()+60000;
  view.innerHTML = `
    <div class="screen" id="screen-gameplay">
      ${G.mode==='daily'?`<div class="mode-badge">${t('daily')}</div>`:''}
      <div class="timer display" id="timerNum">60.00</div>
      <div id="challengeArea"></div>
    </div>`;
  tickTimer();
  nextChallenge();
}
