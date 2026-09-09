import { t } from '../i18n.js';
import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

function scatter(n){
  const w=260, h=148, pad=20, minD=26;
  const pts=[];
  let guard=0;
  while(pts.length<n && guard<500){
    guard++;
    const x=pad+Math.random()*(w-pad*2);
    const y=pad+Math.random()*(h-pad*2);
    if(pts.every(p=>Math.hypot(p.x-x,p.y-y)>=minD)) pts.push({x,y});
  }
  while(pts.length<n){
    const i=pts.length;
    pts.push({ x: pad + ((i * 41) % (w - pad * 2)), y: pad + ((i * 31) % (h - pad * 2)) });
  }
  return pts;
}

function nearbyOpts(n){
  const pool=[n-2,n-1,n+1,n+2].filter(x=>x>=3 && x<=11 && x!==n);
  const opts=[n];
  while(opts.length<3 && pool.length){
    const i=ri(0,pool.length-1);
    opts.push(pool.splice(i,1)[0]);
  }
  opts.sort(()=>Math.random()-.5);
  return opts;
}

export function count(area){
  const n=ri(5,9);
  const pts=scatter(n);
  const opts=nearbyOpts(n);
  area.innerHTML = `<div class="chal-label label">${t('count')}</div>
    <div class="count-field">${pts.map(p=>`<span class="count-pip" style="left:${(p.x/260)*100}%;top:${(p.y/148)*100}%"></span>`).join('')}</div>
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
      if(val===n){
        const elapsed=performance.now()-start;
        finish(elapsed<900?'insane':'good', elapsed<900?260:150, btn, 'right');
      } else {
        finish('bad',0, btn, 'wrong');
      }
    };
  });
}
