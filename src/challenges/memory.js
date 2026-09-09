import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { sTick } from '../audio.js';
import { resultFlash } from '../game/engine.js';

export function memory(area){
  const seq=[ri(0,9),ri(0,9),ri(0,9),ri(0,9)];
  area.innerHTML = `<div class="chal-label label">${t('remember')}</div>
    <div class="mem-digits display" id="memDigits">${seq.join(' ')}</div>`;
  G.memTimer=setTimeout(()=>{
    const input=[];
    area.innerHTML = `<div class="chal-label label">${t('repeat')}</div>
      <div class="mem-slots" id="memSlots">${seq.map(()=>'<div class="mem-slot"></div>').join('')}</div>
      <div class="keypad" id="memKeys">${[1,2,3,4,5,6,7,8,9,'',0,''].map(k=>k===''?'<div></div>':`<button class="key" data-k="${k}">${k}</button>`).join('')}</div>`;
    const start=performance.now();
    G.chalTimeout=setTimeout(()=>resultFlash('bad',0), 4600);
    const slots=area.querySelectorAll('.mem-slot');
    area.querySelectorAll('.key').forEach(k=>{
      k.onpointerdown=()=>{
        const v=parseInt(k.dataset.k);
        const idx=input.length;
        if(v!==seq[idx]){ clearTimeout(G.chalTimeout); resultFlash('bad',0); return; }
        input.push(v); slots[idx].textContent=v; slots[idx].classList.add('filled');
        sTick();
        if(input.length===seq.length){
          clearTimeout(G.chalTimeout);
          const elapsed=performance.now()-start;
          resultFlash(elapsed<2200?'insane':'good', elapsed<2200?300:200);
        }
      };
    });
  }, 1450);
}
