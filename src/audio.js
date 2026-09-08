import { G } from './state.js';

let actx=null;
export function ctx(){ if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); return actx; }
export function beep({freq=440,dur=.05,type='sine',gain=.15,glideTo=null}){
  if(!G.sound) return;
  try{
    const c=ctx(); const o=c.createOscillator(); const g=c.createGain();
    o.type=type; o.frequency.value=freq; g.gain.value=gain;
    o.connect(g); g.connect(c.destination);
    const now=c.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
    if(glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, now+dur);
    o.start(now); o.stop(now+dur+0.02);
  }catch(e){}
}
export const sTick=()=>beep({freq:1500,dur:.03,type:'square',gain:.05});
export const sPop=()=>beep({freq:620,dur:.06,type:'sine',gain:.12,glideTo:1000});
export const sSuccess=()=>beep({freq:800,dur:.09,type:'sine',gain:.16,glideTo:1400});
export const sInsane=()=>{beep({freq:650,dur:.12,type:'sine',gain:.18,glideTo:1800}); setTimeout(()=>beep({freq:1300,dur:.09,gain:.15,glideTo:2100}),55);};
export const sError=()=>beep({freq:180,dur:.18,type:'sawtooth',gain:.14,glideTo:70});
export const sCountdown=()=>beep({freq:520,dur:.08,type:'square',gain:.16});
export const sGo=()=>beep({freq:900,dur:.16,type:'square',gain:.2,glideTo:1500});
export const sTension=()=>beep({freq:2000,dur:.02,type:'square',gain:.05});
export const sImpact=()=>beep({freq:100,dur:.35,type:'sine',gain:.28});
