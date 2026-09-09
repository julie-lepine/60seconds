import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function reaction(area){
  area.innerHTML = `<div class="reaction-full wait" id="reacBox"><div class="reaction-text">${t('wait')}</div></div>`;
  const box=document.getElementById('reacBox');
  let started=false, tooSoon=false;
  box.onpointerdown=()=>{
    if(!started){ tooSoon=true; clearTimeout(G.reactionTimer); resultFlash('bad',0); }
  };
  const delay=ri(900,2400);
  G.reactionTimer=setTimeout(()=>{
    if(tooSoon) return;
    started=true;
    box.classList.remove('wait'); box.classList.add('now');
    box.querySelector('.reaction-text').textContent=t('now');
    const t0=performance.now();
    G.chalTimeout=setTimeout(()=>resultFlash('bad',0), 1500);
    box.onpointerdown=()=>{
      clearTimeout(G.chalTimeout);
      const rt=performance.now()-t0;
      if(rt<250) resultFlash('insane',300);
      else if(rt<550) resultFlash('good',170);
      else resultFlash('bad',0);
    };
  }, delay);
}
