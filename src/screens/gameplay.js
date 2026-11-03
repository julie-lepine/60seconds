import { t } from '../i18n.js';
import { G } from '../state.js';
import { makeDailyPicker } from '../game/daily.js';
import { nextChallenge } from '../game/engine.js';
import { tickTimer } from '../game/timer.js';
import { view } from '../dom.js';
import { clearGameTimers } from '../utils.js';
import { createGameSession, getActiveGameSession, abandonGameSession } from '../achievements/session.js';
import { renderHome } from './home.js';

const QUIT_CONFIRM_MS = 2500;
let quitConfirmTimer = null;

// Quitter la partie en cours : le score ne compte nulle part (ni record, ni classement, ni succès, ni série).
export function quitGame(){
  if(G.screen !== 'gameplay' || G.mode === 'daily') return false;
  clearTimeout(quitConfirmTimer); quitConfirmTimer = null;
  clearGameTimers();
  const session = getActiveGameSession();
  if(session) abandonGameSession(session.sessionId);
  G.rng = null; G.dailyPick = null; G.score = 0;
  renderHome();
  return true;
}

// Deux appuis pour éviter un abandon accidentel en pleine partie.
function onQuitTap(event){
  const button = event.currentTarget;
  if(button.dataset.armed === '1'){ quitGame(); return; }
  button.dataset.armed = '1';
  button.classList.add('armed');
  button.textContent = t('quitConfirm');
  clearTimeout(quitConfirmTimer);
  quitConfirmTimer = setTimeout(() => {
    quitConfirmTimer = null;
    button.dataset.armed = '0';
    button.classList.remove('armed');
    button.textContent = t('quit');
  }, QUIT_CONFIRM_MS);
}

export function startPlay(){
  if(G.screen==='gameplay') return;
  clearGameTimers();
  G.screen='gameplay'; G.score=0; G.lastSecMark=null; G.lastType=null;
  G.dailyPick = G.mode==='daily' ? makeDailyPicker() : null;
  G.dailyIndex = 0; G.rng = null; G.hcErrors = 0;
  createGameSession(G.mode);
  G.endTime = performance.now()+60000;
  view.innerHTML = `
    <div class="screen" id="screen-gameplay">
      ${G.mode==='daily'?`<div class="mode-badge">${t('daily')}</div>`:''}
      ${G.mode==='hardcore'?`<div class="mode-badge">${t('hardcore')}</div>`:''}
      <div class="timer display" id="timerNum">60.00</div>
      ${G.mode==='hardcore'?'<div class="hc-score display" id="hcScore">0</div>':''}
      ${G.mode==='daily'?'':`<button class="quit-btn tap-safe" id="quitBtn" type="button">${t('quit')}</button>`}
      <div id="challengeArea"></div>
    </div>`;
  document.getElementById('quitBtn')?.addEventListener('click', onQuitTap);
  tickTimer();
  nextChallenge();
}
