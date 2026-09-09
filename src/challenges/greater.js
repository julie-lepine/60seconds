import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function greater(area){
  let a=ri(1,99), b=ri(1,99);
  while(b===a) b=ri(1,99);
  const max=Math.max(a,b);
  area.innerHTML = `<div class="chal-label label">${t('greater')}</div>
    <div class="choice-row">
      <button class="choice-btn tap-safe display" data-v="${a}">${a}</button>
      <button class="choice-btn tap-safe display" data-v="${b}">${b}</button>
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
      const val=parseInt(btn.dataset.v,10);
      if(val===max){
        const elapsed=performance.now()-start;
        finish(elapsed<900?'insane':'good', elapsed<900?260:150, btn, 'right');
      } else {
        finish('bad',0, btn, 'wrong');
      }
    };
  });
}
