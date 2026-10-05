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

function achievementRow(item){
  const progress = item.displayType === 'progress'
    ? `<div class="achievement-progress" aria-hidden="true"><span style="width:${(item.progress * 100).toFixed(2)}%"></span></div>`
    : '';
  return `
    <article class="achievement-row ${item.unlocked ? 'unlocked' : 'locked'}" data-achievement-id="${item.id}">
      <div class="achievement-row-head">
        <div class="achievement-title display">${escapeHtml(item.title)}</div>
        ${item.unlocked ? '<span class="achievement-mark" aria-hidden="true"></span>' : ''}
      </div>
      <div class="achievement-description ui">${escapeHtml(item.description)}</div>
      <div class="achievement-state ui">${achievementState(item)}</div>
      ${progress}
    </article>`;
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
    locale: lang
  });

  view.innerHTML = `
    <div class="screen" id="screen-achievements">
      <div class="topnav"><div class="navlink" id="backAchievements">← ${t('home')}</div><div></div></div>
      <div class="achievements-heading">
        <div class="achievements-title display">${t('achievements')}</div>
        <div class="achievements-count display">${fmt(presentation.unlockedCount)} / ${fmt(presentation.totalCount)}</div>
      </div>
      <div class="achievements-list">
        ${presentation.categories.map(category => `
          <section class="achievement-section" data-achievement-category="${category.id}">
            <div class="achievement-category ui">${escapeHtml(category.label)}</div>
            ${category.items.map(achievementRow).join('')}
          </section>`).join('')}
      </div>
    </div>`;

  document.getElementById('backAchievements').onclick = renderHome;
}
