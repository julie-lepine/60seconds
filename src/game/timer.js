import { G } from '../state.js';
import { sTension } from '../audio.js';
import { endGame } from '../screens/end.js';

export function tickTimer(){
  const remain = Math.max(0,(G.endTime-performance.now())/1000);
  const el=document.getElementById('timerNum');
  if(el){
    el.textContent=remain.toFixed(2);
    el.classList.toggle('tense', remain<=10);
    el.classList.toggle('critical', remain<=3);
  }
  const sec=Math.ceil(remain);
  if(sec!==G.lastSecMark && sec<=10 && sec>=1){ G.lastSecMark=sec; sTension(); }
  if(remain<=0){ endGame(); return; }
  G.raf=requestAnimationFrame(tickTimer);
}
