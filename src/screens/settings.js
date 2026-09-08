import { G } from '../state.js';
import { sPop } from '../audio.js';
import { renderHome } from './home.js';

const app = document.getElementById('app');

export function renderSettings(){
  G.screen='settings';
  app.innerHTML = `
    <div class="screen" id="screen-settings">
      <div class="topnav"><div class="navlink" id="backHome2">← ACCUEIL</div><div></div></div>
      <div class="settings-title display">RÉGLAGES</div>
      <div class="set-row"><div class="set-name ui">SON</div><div class="toggle ${G.sound?'on':''}" id="tgSound"><div class="knob"></div></div></div>
      <div class="set-row"><div class="set-name ui">RÉDUIRE LES ANIMATIONS</div><div class="toggle ${G.reduceMotion?'on':''}" id="tgMotion"><div class="knob"></div></div></div>
      <div class="set-row"><div class="set-name ui">À PROPOS</div><div class="ui" style="font-size:12px;color:var(--black-40);">60 SECONDES · v0.1</div></div>
    </div>`;
  document.getElementById('backHome2').onclick=renderHome;
  document.getElementById('tgSound').onclick=(e)=>{ G.sound=!G.sound; e.currentTarget.classList.toggle('on',G.sound); if(G.sound) sPop(); };
  document.getElementById('tgMotion').onclick=(e)=>{
    G.reduceMotion=!G.reduceMotion; e.currentTarget.classList.toggle('on',G.reduceMotion);
    document.body.style.setProperty('--reduce', G.reduceMotion?'1':'0');
    document.documentElement.style.setProperty('scroll-behavior', G.reduceMotion?'auto':'smooth');
  };
}
