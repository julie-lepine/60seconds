import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function oddoneout(area){
  const n=16; const oddIdx=ri(0,n-1);
  let html=`<div class="chal-label label">TROUVE L'INTRUS</div><div class="grid4">`;
  for(let i=0;i<n;i++){ html+=`<div class="dot ${i===oddIdx?'filled':''}" data-i="${i}"></div>`; }
  html+='</div>';
  area.innerHTML=html;
  const start=performance.now();
  G.chalTimeout=setTimeout(()=>resultFlash('bad',0), 3000);
  area.querySelectorAll('.dot').forEach(d=>{
    d.onpointerdown=()=>{
      clearTimeout(G.chalTimeout);
      if(parseInt(d.dataset.i)===oddIdx){
        const elapsed=performance.now()-start;
        resultFlash(elapsed<900?'insane':'good', elapsed<900?260:150);
      } else { resultFlash('bad',0); }
    };
  });
}
