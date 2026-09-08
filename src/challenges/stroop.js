import { G } from '../state.js';
import { ri } from '../utils.js';
import { resultFlash } from '../game/engine.js';

const INKS=[
  { id:'black', word:'NOIR' },
  { id:'cream', word:'CRÈME' },
  { id:'coral', word:'CORAIL' }
];

export function stroop(area){
  const word=INKS[ri(0,INKS.length-1)];
  let ink=INKS[ri(0,INKS.length-1)];
  while(ink.id===word.id) ink=INKS[ri(0,INKS.length-1)];
  area.innerHTML = `<div class="chal-label label">COULEUR</div>
    <div class="chal-big display stroop-word ink-${ink.id}">${word.word}</div>
    <div class="count-opts stroop-opts">
      ${INKS.map(c=>`<button class="opt-btn tap-safe" data-ink="${c.id}">${c.word}</button>`).join('')}
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
  area.querySelectorAll('.opt-btn').forEach(btn=>{
    btn.onpointerdown=()=>{
      if(btn.dataset.ink===ink.id){
        const elapsed=performance.now()-start;
        finish(elapsed<900?'insane':'good', elapsed<900?260:150, btn, 'right');
      } else {
        finish('bad',0, btn, 'wrong');
      }
    };
  });
}
