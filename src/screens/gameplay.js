import { G } from '../state.js';
import { buildDailySeq } from '../game/daily.js';
import { nextChallenge } from '../game/engine.js';
import { tickTimer } from '../game/timer.js';
import { view } from '../dom.js';

export function startPlay(){
  G.screen='gameplay'; G.score=0; G.lastSecMark=null; G.lastType=null;
  if(G.mode==='daily'){ G.dailySeq=buildDailySeq(); G.dailyIdx=0; }
  G.endTime = performance.now()+60000;
  view.innerHTML = `
    <div class="screen" id="screen-gameplay">
      ${G.mode==='daily'?'<div class="mode-badge">LES 60 DU JOUR</div>':''}
      <div class="timer display" id="timerNum">60.00</div>
      <div id="challengeArea"></div>
    </div>`;
  tickTimer();
  nextChallenge();
}
