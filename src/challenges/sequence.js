import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

function makeSeq(){
  for(let i=0;i<40;i++){
    const mag=[2,3,5,10][ri(0,3)];
    const step=ri(0,1)===0?mag:-mag;
    const start=step>0?ri(1,16):ri(18,42);
    const shown=[start, start+step, start+2*step];
    const missing=start+3*step;
    if(shown.some(n=>n<1 || n>99) || missing<1 || missing>99) continue;
    return { shown, missing, step };
  }
  return { shown:[2,4,6], missing:8, step:2 };
}

function nearbyOpts(missing, step){
  const pool=[missing-step, missing+step, missing-1, missing+1, missing-2, missing+2]
    .filter(x=>x!==missing && x>=1 && x<=99);
  const uniq=[];
  pool.forEach(x=>{ if(!uniq.includes(x)) uniq.push(x); });
  const opts=[missing];
  while(opts.length<3 && uniq.length){
    opts.push(uniq.splice(ri(0,uniq.length-1),1)[0]);
  }
  opts.sort(()=>Math.random()-.5);
  return opts;
}

export function sequence(area){
  const { shown, missing, step }=makeSeq();
  const opts=nearbyOpts(missing, step);
  area.innerHTML = `<div class="chal-label label">${t('sequence')}</div>
    <div class="chal-big display">${shown.join('  ')}  ?</div>
    <div class="count-opts">${opts.map(o=>`<button class="opt-btn tap-safe" data-v="${o}">${o}</button>`).join('')}</div>`;
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
  area.querySelectorAll('.opt-btn').forEach(btn=>{
    btn.onpointerdown=()=>{
      const val=parseInt(btn.dataset.v,10);
      if(val===missing){
        const elapsed=performance.now()-start;
        finish(elapsed<900?'insane':'good', elapsed<900?260:150, btn, 'right');
      } else {
        finish('bad',0, btn, 'wrong');
      }
    };
  });
}
