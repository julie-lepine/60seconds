import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

export function evenodd(area){
  const n=ri(10,999);
  const even=n%2===0;
  area.innerHTML = `<div class="chal-label label">PAIR OU IMPAIR</div>
    <div class="chal-big display">${n}</div>
    <div class="choice-row">
      <button class="choice-btn tap-safe" data-even="1"><span class="choice-caption ui">PAIR</span></button>
      <button class="choice-btn tap-safe" data-even="0"><span class="choice-caption ui">IMPAIR</span></button>
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
      const pick=btn.dataset.even==='1';
      if(pick===even){
        const elapsed=performance.now()-start;
        finish(elapsed<900?'insane':'good', elapsed<900?260:150, btn, 'right');
      } else {
        finish('bad',0, btn, 'wrong');
      }
    };
  });
}
