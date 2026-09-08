import { G } from '../state.js';
import { fmt } from '../utils.js';
import { renderHome } from './home.js';

const app = document.getElementById('app');

export function renderScores(){
  G.screen='scores';
  const mock=[
    {n:'M. ARNAUD',v:58210},{n:'J. PELLETIER',v:52940},
    {n:'TOI',v:G.best,me:true},{n:'S. KOVACS',v:41870},{n:'A. DIALLO',v:38520}
  ].sort((a,b)=>b.v-a.v);
  app.innerHTML = `
    <div class="screen" id="screen-scores">
      <div class="topnav"><div class="navlink" id="backHome">← ACCUEIL</div><div></div></div>
      <div class="scores-title display">SCORES</div>
      ${mock.map((r,i)=>`<div class="score-row ${r.me?'me':''}"><div class="rank ui">${i+1}</div><div class="name ui">${r.n}</div><div class="val display">${fmt(r.v)}</div></div>`).join('')}
    </div>`;
  document.getElementById('backHome').onclick=renderHome;
}
