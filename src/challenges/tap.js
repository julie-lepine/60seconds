import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { sPop } from '../audio.js';
import { resultFlash } from '../game/engine.js';

export function tap(area){
  const target = ri(8,13); let count=0;
  const budget = 3300;
  area.innerHTML = `<div class="chal-label label">${t('tap')}</div>
    <button class="tap-target tap-safe" id="tapBtn"></button>
    <div class="tap-count ui" id="tapCount">0 / ${target}</div>`;
  const btn=document.getElementById('tapBtn'); const cnt=document.getElementById('tapCount');
  const start=performance.now();
  G.chalTimeout=setTimeout(()=>resultFlash('bad',0), budget);
  btn.onpointerdown=()=>{
    count++; cnt.textContent=`${count} / ${target}`;
    if(!G.reduceMotion){
      btn.classList.add('hit');
      setTimeout(()=>btn.classList.remove('hit'),70);
    }
    sPop();
    if(count>=target){
      clearTimeout(G.chalTimeout);
      const elapsed=performance.now()-start;
      const ratio = elapsed/budget;
      resultFlash(ratio<0.55?'insane':'good', ratio<0.55?260:150);
    }
  };
}
