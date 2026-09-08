import { G } from '../state.js';
import { sCountdown, sGo } from '../audio.js';
import { getBestScore } from '../storage.js';
import { startPlay } from './gameplay.js';

const app = document.getElementById('app');

export function startCountdown(mode){
  G.mode=mode; G.best=getBestScore(mode); G.screen='countdown';
  app.innerHTML = `
    <div class="screen" id="screen-countdown">
      <div class="cd-pretitle">${mode==='daily'?"LES 60 DU JOUR":'60 SECONDES'}</div>
      <div class="cd-number display" id="cdNum">3</div>
    </div>`;
  const el=document.getElementById('cdNum');
  const seq=['3','2','1','GO'];
  let i=0;
  function step(){
    el.textContent=seq[i];
    el.classList.toggle('cd-go', seq[i]==='GO');
    el.style.transform='scale(.7)'; el.style.opacity='0';
    requestAnimationFrame(()=>{ el.style.transition='transform .18s cubic-bezier(.2,1.4,.4,1), opacity .12s'; el.style.transform='scale(1)'; el.style.opacity='1'; });
    if(seq[i]==='GO') sGo(); else sCountdown();
    i++;
    if(i<seq.length){ setTimeout(step,650); } else { setTimeout(startPlay,550); }
  }
  step();
}
