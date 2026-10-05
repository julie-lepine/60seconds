import { t, lang } from '../i18n.js';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from './catalog.js';
import { countScopeProgress } from './scopes.js';

const PROGRESS_SOURCE_BY_ID = Object.freeze({
  streak_2: 'streak',
  streak_7: 'streak',
  streak_14: 'streak',
  streak_30: 'streak',
  streak_60: 'streak',
  streak_100: 'streak',
  streak_365: 'streak',
  daily_7: 'daily',
  daily_30: 'daily',
  score_1000: 'score',
  score_2500: 'score',
  score_5000: 'score',
  score_8000: 'score',
  score_12000: 'score',
  records_5: 'records',
  all_succeeded_v1: 'collectionSucceeded',
  games_10: 'games',
  games_50: 'games',
  games_100: 'games',
  games_500: 'games',
  seconds_3600: 'seconds',
  seconds_36000: 'seconds',
  all_seen_v1: 'collectionSeen'
});

const CATEGORY_TRANSLATION_KEYS = Object.freeze({
  consistency: 'achievementCategoryConsistency',
  scores: 'achievementCategoryScores',
  mastery: 'achievementCategoryMastery',
  experience: 'achievementCategoryExperience'
});

const DATE_LOCALES = Object.freeze({
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE'
});

function safeCount(value){
  return Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.floor(Number(value)) : 0;
}

function targetFor(item){
  return safeCount(
    item.params.days ??
    item.params.count ??
    item.params.score ??
    item.params.seconds
  );
}

function metricFor(source, item, data){
  switch(source){
    case 'streak':
      return { current: safeCount(data.streakCount), total: targetFor(item) };
    case 'daily':
      return { current: safeCount(data.progress.stats.dailyCompleted), total: targetFor(item) };
    case 'score':
      return { current: safeCount(data.bestScore), total: targetFor(item) };
    case 'records':
      return { current: safeCount(data.progress.stats.recordsBroken), total: targetFor(item) };
    case 'games':
      return { current: safeCount(data.progress.stats.gamesCompleted), total: targetFor(item) };
    case 'seconds':
      return { current: safeCount(data.progress.stats.playSeconds), total: targetFor(item) };
    case 'collectionSeen':
      return countScopeProgress(data.progress.stats.seenTypes, item.params.scopeId);
    case 'collectionSucceeded':
      return countScopeProgress(data.progress.stats.succeededTypes, item.params.scopeId);
    default:
      return null;
  }
}

export function achievementTranslationKey(id, field){
  return `achievement.${id}.${field}`;
}

export function localizeAchievement(item, translate = t){
  return {
    title: translate(achievementTranslationKey(item.id, 'title')),
    description: translate(achievementTranslationKey(item.id, 'description'))
  };
}

export function formatAchievementUnlockDate(value, locale = lang){
  if(typeof value !== 'string') return null;
  const date = new Date(value);
  if(!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(DATE_LOCALES[locale] || locale || 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function buildAchievementPresentation({
  progress,
  streakCount = 0,
  bestScore = 0,
  locale = lang,
  translate = t,
  catalog = ACHIEVEMENTS
}){
  const unlocked = progress?.unlocked && typeof progress.unlocked === 'object'
    ? progress.unlocked
    : {};
  const safeProgress = {
    stats: {
      dailyCompleted: safeCount(progress?.stats?.dailyCompleted),
      recordsBroken: safeCount(progress?.stats?.recordsBroken),
      gamesCompleted: safeCount(progress?.stats?.gamesCompleted),
      playSeconds: safeCount(progress?.stats?.playSeconds),
      seenTypes: Array.isArray(progress?.stats?.seenTypes) ? progress.stats.seenTypes : [],
      succeededTypes: Array.isArray(progress?.stats?.succeededTypes) ? progress.stats.succeededTypes : []
    }
  };

  const items = catalog.map(item => {
    const isUnlocked = typeof unlocked[item.id] === 'string';
    const source = PROGRESS_SOURCE_BY_ID[item.id] || null;
    const metric = source ? metricFor(source, item, {
      progress: safeProgress,
      streakCount,
      bestScore
    }) : null;
    const total = metric ? safeCount(metric.total) : null;
    const rawCurrent = metric ? safeCount(metric.current) : null;
    const current = metric ? (isUnlocked ? total : Math.min(rawCurrent, total)) : null;
    const copy = localizeAchievement(item, translate);

    return Object.freeze({
      id: item.id,
      category: item.category,
      categoryLabel: translate(CATEGORY_TRANSLATION_KEYS[item.category]),
      title: copy.title,
      description: copy.description,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? unlocked[item.id] : null,
      unlockedDate: isUnlocked ? formatAchievementUnlockDate(unlocked[item.id], locale) : null,
      displayType: isUnlocked ? 'unlocked' : (metric ? 'progress' : 'locked'),
      currentValue: current,
      targetValue: total,
      progress: metric && total > 0 ? Math.min(1, current / total) : null
    });
  });

  return Object.freeze({
    items: Object.freeze(items),
    categories: Object.freeze(
      Object.keys(ACHIEVEMENT_CATEGORIES).map(category => Object.freeze({
        id: category,
        label: translate(CATEGORY_TRANSLATION_KEYS[category]),
        items: Object.freeze(items.filter(item => item.category === category))
      }))
    ),
    unlockedCount: items.filter(item => item.unlocked).length,
    totalCount: items.length
  });
}
