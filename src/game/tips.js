// Consignes du premier passage : une phrase par type d'épreuve, affichée UNE fois.
// Le chrono est mis en pause pendant l'affichage (G.pauseStart), puis la partie reprend
// avec le même temps restant : le défi du jour reste équitable.
import { t } from '../i18n.js';
import { G } from '../state.js';
import { getAchievementProgress } from '../achievements/storage.js';

const KEY = '60seconds_tips_seen';

// Titre de la consigne = libellé que le joueur verra dans l'épreuve.
const TITLE_KEYS = {
  tap: 'tap', math: 'math', timing: 'stop', oddoneout: 'oddoneout', reaction: 'wait',
  memory: 'remember', greater: 'greater', count: 'count', evenodd: 'evenOdd',
  leftright: 'leftRight', goNoGo: 'tapGo', sequence: 'sequence', direction: 'direction', stroop: 'color'
};

export function tipTypes(){ return Object.keys(TITLE_KEYS); }

function readSeen(){
  try{
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
  }catch{
    return [];
  }
}

function alreadyPlayed(type){
  try{
    const seen = getAchievementProgress()?.stats?.seenTypes;
    return Array.isArray(seen) && seen.includes(type);
  }catch{
    return false;
  }
}

// Les joueurs existants (qui ont déjà vu l'épreuve) ne reçoivent jamais de consigne.
export function shouldShowTip(type){
  if(!TITLE_KEYS[type]) return false;
  return !readSeen().includes(type) && !alreadyPlayed(type);
}

export function markTipSeen(type){
  try{
    const seen = readSeen();
    if(!seen.includes(type)) localStorage.setItem(KEY, JSON.stringify([...seen, type]));
  }catch{}
}

export function resumeFromTip(now = performance.now()){
  if(G.pauseStart != null){
    G.endTime += Math.max(0, now - G.pauseStart);
    G.pauseStart = null;
  }
}

// Affiche la consigne dans `area`, met le chrono en pause, puis appelle onDone() au toucher.
export function showTip(area, type, onDone){
  G.pauseStart = performance.now();
  area.innerHTML = `<div class="tip-card">
      <div class="tip-heading label">${t('tipHeading')}</div>
      <div class="tip-title display">${t(TITLE_KEYS[type])}</div>
      <div class="tip-text">${t('tip_' + type)}</div>
      <button class="tip-btn tap-safe" id="tipOk" type="button">${t('tipOk')}</button>
      <div class="tip-note ui">${t('tipPaused')}</div>
    </div>`;
  const button = document.getElementById('tipOk');
  let done = false;
  const go = () => {
    if(done || G.screen !== 'gameplay') return;
    done = true;
    markTipSeen(type);
    resumeFromTip();
    area.innerHTML = '';
    onDone();
  };
  if(button) button.onclick = go;
}
