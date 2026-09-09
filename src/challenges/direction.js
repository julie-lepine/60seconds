import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

const DIRS=[
  { id:'up', glyph:'↑' },
  { id:'right', glyph:'→' },
  { id:'down', glyph:'↓' },
  { id:'left', glyph:'←' }
];

export function direction(area){
  const target=DIRS[ri(0,DIRS.length-1)];
  area.innerHTML = `<div class="chal-label label">${t('direction')}</div>
    <div class="chal-big display dir-stim">${target.glyph}</div>
    <div class="dir-grid">
      <button class="choice-btn tap-safe display" data-d="up">↑</button>
      <button class="choice-btn tap-safe display" data-d="right">→</button>
      <button class="choice-btn tap-safe display" data-d="left">←</button>
      <button class="choice-btn tap-safe display" data-d="down">↓</button>
    </div>`;
  const start=performance.now();
  let locked=false;
  const finish=(kind, pts, btn, cls)=>{
    if(locked) return;
    locked=true;
    clearTimeout(G.chalTimeout);
    if(btn && cls) btn.classList.add(cls);
    resultFlash(kind, pts);
  };
  G.chalTimeout=setTimeout(()=>finish('bad',0), 3400);
  area.querySelectorAll('.choice-btn').forEach(btn=>{
    btn.onpointerdown=()=>{
      if(btn.dataset.d===target.id){
        const elapsed=performance.now()-start;
        finish(elapsed<900?'insane':'good', elapsed<900?260:150, btn, 'right');
      } else {
        finish('bad',0, btn, 'wrong');
      }
    };
  });
}
