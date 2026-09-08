import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function math(area){
  const a=ri(2,9), b=ri(2,9); const correct=a*b;
  let opts=[correct];
  while(opts.length<3){ const d=correct+ri(-12,12)*(Math.random()<.5?1:-1); if(d>0 && !opts.includes(d)) opts.push(d); }
  opts.sort(()=>Math.random()-.5);
  area.innerHTML = `<div class="chal-label label">CALCUL</div>
    <div class="chal-big display">${a} × ${b}</div>
    <div class="opt-list">${opts.map(o=>`<button class="opt-btn" data-v="${o}">${o}</button>`).join('')}</div>`;
  const start=performance.now();
  G.chalTimeout=setTimeout(()=>resultFlash('bad',0), 3400);
  area.querySelectorAll('.opt-btn').forEach(b=>{
    b.onpointerdown=()=>{
      clearTimeout(G.chalTimeout);
      const val=parseInt(b.dataset.v);
      if(val===correct){
        b.classList.add('right');
        const elapsed=performance.now()-start;
        resultFlash(elapsed<900?'insane':'good', elapsed<900?260:150);
      } else {
        b.classList.add('wrong');
        resultFlash('bad',0);
      }
    };
  });
}
