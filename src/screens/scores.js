import { t } from '../i18n.js';
import { G } from '../state.js';
import { escapeHtml, fmt } from '../utils.js';
import { getUsername } from '../storage.js';
import { getLeaderboard, getPlayerRank } from '../leaderboard/leaderboard.js';
import { view } from '../dom.js';
import { renderHome } from './home.js';

function scoreRow(rank, name, score, me){
  return `<div class="score-row ${me ? 'me' : ''}"><div class="rank ui">${rank}</div><div class="name ui">${escapeHtml(name)}</div><div class="val display">${fmt(score)}</div></div>`;
}

function statusHtml(text){
  return `<div class="scores-status ui">${text}</div>`;
}

export function renderScores(){
  G.screen = 'scores';
  let mode = G.mode === 'daily' ? 'daily' : 'normal';
  let loadId = 0;

  view.innerHTML = `
    <div class="screen" id="screen-scores">
      <div class="topnav"><div class="navlink" id="backHome">← ${t('home')}</div><div></div></div>
      <div class="scores-title display">${t('scores')}</div>
      <div class="scores-tabs">
        <button type="button" class="scores-tab" id="tabGeneral">${t('tabGeneral')}</button>
        <button type="button" class="scores-tab" id="tabDaily">${t('tabDaily')}</button>
      </div>
      <div class="scores-list" id="scoresBody"></div>
    </div>`;

  const tabGeneral = document.getElementById('tabGeneral');
  const tabDaily = document.getElementById('tabDaily');
  const body = document.getElementById('scoresBody');

  function paintTabs(){
    tabGeneral.classList.toggle('on', mode === 'normal');
    tabDaily.classList.toggle('on', mode === 'daily');
  }

  function paintList(rows, me){
    const username = getUsername();
    if(!rows.length){
      body.innerHTML = statusHtml(t('noScores'));
      return;
    }
    const mineInList = username ? rows.some(r => r.username === username) : false;
    let html = rows.map((r, i) => scoreRow(i + 1, r.username, r.score, username && r.username === username)).join('');
    if(me?.rank && !mineInList && username){
      html += `<div class="scores-rest">${scoreRow(me.rank, username, me.score, true)}</div>`;
    }
    body.innerHTML = html;
  }

  async function load(){
    const id = ++loadId;
    body.innerHTML = statusHtml(t('loading'));
    const [{ rows, error }, me] = await Promise.all([
      getLeaderboard(mode),
      getPlayerRank(mode)
    ]);
    if(id !== loadId || G.screen !== 'scores') return;
    if(error){
      body.innerHTML = statusHtml(t('leaderboardUnavailable'));
      return;
    }
    paintList(rows, me);
  }

  function setMode(next){
    mode = next;
    paintTabs();
    load();
  }

  tabGeneral.onclick = () => setMode('normal');
  tabDaily.onclick = () => setMode('daily');
  document.getElementById('backHome').onclick = renderHome;
  setMode(mode);
}
