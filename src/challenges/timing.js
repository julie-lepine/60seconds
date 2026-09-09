import { t } from '../i18n.js';
import { G } from '../state.js';
import { rand } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function timing(area){
  const target = parseFloat(rand(1.5,3.4).toFixed(2));
  area.innerHTML = `<div class="chal-label label">${t('tapAt', { target: target.toFixed(2) })}</div>
    <div class="chal-big display" id="runNum">0.00</div>
    <button class="stop-btn tap-safe" id="stopBtn">${t('stop')}</button>`;
  const start=performance.now();
  const num=document.getElementById('runNum');
  G.timingInterval=setInterval(()=>{ num.textContent=((performance.now()-start)/1000).toFixed(2); },10);
  G.chalTimeout=setTimeout(()=>{ clearInterval(G.timingInterval); resultFlash('bad',0); }, target*1000+1800);
  document.getElementById('stopBtn').onpointerdown=()=>{
    clearInterval(G.timingInterval); clearTimeout(G.chalTimeout);
    const elapsed=(performance.now()-start)/1000;
    const diff=Math.abs(elapsed-target);
    if(diff<0.05) resultFlash('insane',320);
    else if(diff<0.18) resultFlash('good',180);
    else resultFlash('bad',0);
  };
}
