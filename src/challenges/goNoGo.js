import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function goNoGo(area){
  const go=ri(0,1)===0;
  area.innerHTML = `<div class="chal-label label">${go?t('tapGo'):t('dontTouch')}</div>
    <button type="button" class="gono-hit tap-safe">
      <span class="gono-stim ${go?'go':'nogo'}"></span>
    </button>`;
  const start=performance.now();
  let locked=false;
  const finish=(kind, pts)=>{
    if(locked) return;
    locked=true;
    clearTimeout(G.chalTimeout);
    resultFlash(kind, pts);
  };
  G.chalTimeout=setTimeout(()=>{
    if(go) finish('bad',0);
    else finish('insane',260);
  }, 3000);
  area.querySelector('.gono-hit').onpointerdown=()=>{
    if(go){
      const elapsed=performance.now()-start;
      finish(elapsed<900?'insane':'good', elapsed<900?260:150);
    } else {
      finish('bad',0);
    }
  };
}
