import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function leftright(area){
  const left=ri(0,1)===0;
  area.innerHTML = `<div class="chal-label label">${t('leftRight')}</div>
    <div class="choice-row">
      <button class="choice-btn tap-safe" data-left="1">
        ${left?'<span class="choice-pip"></span>':''}
        <span class="choice-caption ui">${t('left')}</span>
      </button>
      <button class="choice-btn tap-safe" data-left="0">
        ${left?'':'<span class="choice-pip"></span>'}
        <span class="choice-caption ui">${t('right')}</span>
      </button>
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
      const pick=btn.dataset.left==='1';
      if(pick===left){
        const elapsed=performance.now()-start;
        finish(elapsed<900?'insane':'good', elapsed<900?260:150, btn, 'right');
      } else {
        finish('bad',0, btn, 'wrong');
      }
    };
  });
}
