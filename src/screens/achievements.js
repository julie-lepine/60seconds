import { t, lang } from '../i18n.js';
import { G } from '../state.js';
import { escapeHtml, fmt } from '../utils.js';
import { getBestScore } from '../storage.js';
import {
  getAchievementProgress,
  getAchievementStreakStatus
} from '../achievements/storage.js';
import { buildAchievementPresentation } from '../achievements/presentation.js';
import { view } from '../dom.js';
import { renderHome } from './home.js';

function achievementState(item){
  if(item.unlocked){
    return escapeHtml(
      item.unlockedDate
        ? t('achievementUnlockedOn', { date: item.unlockedDate })
        : t('achievementUnlocked')
    );
  }
  if(item.displayType === 'progress'){
    return `${fmt(item.currentValue)} / ${fmt(item.targetValue)}`;
  }
  return escapeHtml(t('achievementLocked'));
}

const VISIBLE_LOCKED = 4;

function progressBar(item){
  return item.displayType === 'progress'
    ? `<div class="achievement-progress" aria-hidden="true"><span style="width:${(item.progress * 100).toFixed(2)}%"></span></div>`
    : '';
}

function achievementRow(item){
  if(item.unlocked){
    return `
    <article class="achievement-row unlocked" data-achievement-id="${item.id}">
      <button class="achievement-summary" type="button" data-toggle="detail" aria-expanded="false">
        <span class="achievement-row-head">
          <span class="achievement-title display">${escapeHtml(item.title)}</span>
          <span class="achievement-mark" aria-hidden="true"></span>
        </span>
        <span class="achievement-summary-foot">
          <span class="achievement-state ui">${achievementState(item)}</span>
          <span class="achievement-chevron" aria-hidden="true"></span>
        </span>
      </button>
      <div class="achievement-description ui achievement-detail" data-fold="detail" hidden>${escapeHtml(item.description)}</div>
    </article>`;
  }
  return `
    <article class="achievement-row locked" data-achievement-id="${item.id}">
      <div class="achievement-row-head">
        <div class="achievement-title display">${escapeHtml(item.title)}</div>
        <div class="achievement-state ui">${achievementState(item)}</div>
      </div>
      <div class="achievement-description ui">${escapeHtml(item.description)}</div>
      ${progressBar(item)}
    </article>`;
}

function nextBlock(item){
  if(!item) return '';
  return `
      <div class="achievement-next" data-next-achievement="${item.id}">
        <div class="achievement-next-label ui">${escapeHtml(t('achievementNext'))}</div>
        <div class="achievement-next-title display">${escapeHtml(item.title)}</div>
        <div class="achievement-description ui">${escapeHtml(item.description)}</div>
        ${item.displayType === 'progress' ? `<div class="achievement-next-state ui">${achievementState(item)}</div>` : ''}
        ${progressBar(item)}
      </div>`;
}

function sectionHtml(category){
  const shown = category.locked.slice(0, VISIBLE_LOCKED);
  const more = category.locked.slice(VISIBLE_LOCKED);
  return `
          <section class="achievement-section ${category.id === 'hardcore' ? 'hardcore' : ''}" data-achievement-category="${category.id}">
            <div class="achievement-category ui"><span>${escapeHtml(category.label)}</span><span class="achievement-category-count">${fmt(category.unlockedCount)} / ${fmt(category.totalCount)}</span></div>
            ${shown.map(achievementRow).join('')}
            ${more.length ? `
            <div class="achievement-fold" data-fold="more" hidden>${more.map(achievementRow).join('')}</div>
            <button class="achievement-toggle ui" type="button" data-toggle="more" aria-expanded="false">${escapeHtml(t('achievementsShowMore', { count: fmt(more.length) }))}</button>` : ''}
            ${category.unlocked.length ? `
            <button class="achievement-toggle done ui" type="button" data-toggle="done" aria-expanded="false"><span>${escapeHtml(t('achievementsUnlockedFold', { count: fmt(category.unlocked.length) }))}</span><span class="achievement-chevron" aria-hidden="true"></span></button>
            <div class="achievement-fold" data-fold="done" hidden>${category.unlocked.map(achievementRow).join('')}</div>` : ''}
          </section>`;
}

export function renderAchievements(){
  G.screen = 'achievements';
  const progress = getAchievementProgress();
  const streak = getAchievementStreakStatus();
  const bestScore = Math.max(getBestScore('normal'), getBestScore('daily'));
  const presentation = buildAchievementPresentation({
    progress,
    streakCount: streak.count,
    bestScore,
    hardcoreBestScore: getBestScore('hardcore'),
    locale: lang
  });

  view.innerHTML = `
    <div class="screen" id="screen-achievements">
      <div class="topnav"><div class="navlink" id="backAchievements">← ${t('home')}</div><div></div></div>
      <div class="achievements-heading">
        <div class="achievements-title display">${t('achievements')}</div>
        <div class="achievements-count display">${fmt(presentation.unlockedCount)} / ${fmt(presentation.totalCount)}</div>
      </div>
      <div class="achievements-bar" aria-hidden="true"><span style="width:${presentation.totalCount ? ((presentation.unlockedCount / presentation.totalCount) * 100).toFixed(2) : 0}%"></span></div>
      <div class="achievements-list" id="achievementsList">
        ${nextBlock(presentation.next)}
        ${presentation.categories.map(sectionHtml).join('')}
      </div>
    </div>`;

  document.getElementById('backAchievements').onclick = renderHome;
  const list = document.getElementById('achievementsList');
  if(list) list.onclick = event => {
    const button = event.target?.closest?.('[data-toggle]');
    if(!button) return;
    const fold = button.parentElement.querySelector(`[data-fold="${button.dataset.toggle}"]`);
    if(!fold) return;
    const open = fold.hidden;
    fold.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    // « Voir les autres » disparaît une fois ouvert ; « Débloqués » reste pour pouvoir se replier.
    if(button.dataset.toggle === 'more') button.hidden = true;
  };
}
