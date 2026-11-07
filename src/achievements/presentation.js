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
  score_4000: 'score',
  score_6000: 'score',
  score_8000: 'score',
  score_12000: 'score',
  new_record: 'records',
  records_5: 'records',
  all_succeeded_v1: 'collectionSucceeded',
  games_10: 'games',
  games_50: 'games',
  games_100: 'games',
  games_500: 'games',
  seconds_3600: 'seconds',
  seconds_36000: 'seconds',
  all_seen_v1: 'collectionSeen',
  hardcore_score_2000: 'hardcoreScore',
  hardcore_score_4000: 'hardcoreScore',
  hardcore_score_6000: 'hardcoreScore',
  hardcore_records_3: 'hardcoreRecords',
  hardcore_all_succeeded_v1: 'hardcoreCollection'
});

const HIDDEN_UNTIL_UNLOCKED = new Set(['return_after_7_days']);

const CATEGORY_TRANSLATION_KEYS = Object.freeze({
  consistency: 'achievementCategoryConsistency',
  scores: 'achievementCategoryScores',
  mastery: 'achievementCategoryMastery',
  experience: 'achievementCategoryExperience',
  hardcore: 'achievementCategoryHardcore'
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
    case 'hardcoreScore':
      return { current: safeCount(data.hardcoreBestScore), total: targetFor(item) };
    case 'hardcoreRecords':
      return { current: safeCount(data.progress.stats.hardcoreRecordsBroken), total: targetFor(item) };
    case 'hardcoreCollection':
      return countScopeProgress(data.progress.stats.hardcoreSucceededTypes, item.params.scopeId);
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
  hardcoreBestScore = 0,
  locale = lang,
  translate = t,
  catalog = ACHIEVEMENTS
}){
  const unlocked = progress?.unlocked && typeof progress.unlocked === 'object'
    ? progress.unlocked
    : {};
  const reconciled = new Set(Array.isArray(progress?.reconciled) ? progress.reconciled : []);
  const safeProgress = {
    stats: {
      dailyCompleted: safeCount(progress?.stats?.dailyCompleted),
      recordsBroken: safeCount(progress?.stats?.recordsBroken),
      hardcoreRecordsBroken: safeCount(progress?.stats?.hardcoreRecordsBroken),
      hardcoreSucceededTypes: Array.isArray(progress?.stats?.hardcoreSucceededTypes) ? progress.stats.hardcoreSucceededTypes : [],
      gamesCompleted: safeCount(progress?.stats?.gamesCompleted),
      playSeconds: safeCount(progress?.stats?.playSeconds),
      seenTypes: Array.isArray(progress?.stats?.seenTypes) ? progress.stats.seenTypes : [],
      succeededTypes: Array.isArray(progress?.stats?.succeededTypes) ? progress.stats.succeededTypes : []
    }
  };

  const items = catalog.flatMap(item => {
    const isUnlocked = typeof unlocked[item.id] === 'string';
    const source = PROGRESS_SOURCE_BY_ID[item.id] || null;
    const metric = source ? metricFor(source, item, {
      progress: safeProgress,
      streakCount,
      bestScore,
      hardcoreBestScore
    }) : null;
    const total = metric ? safeCount(metric.total) : null;
    const rawCurrent = metric ? safeCount(metric.current) : null;
    const current = metric ? (isUnlocked ? total : Math.min(rawCurrent, total)) : null;
    if(!isUnlocked && HIDDEN_UNTIL_UNLOCKED.has(item.id)) return [];
    const copy = localizeAchievement(item, translate);

    return Object.freeze({
      id: item.id,
      category: item.category,
      categoryLabel: translate(CATEGORY_TRANSLATION_KEYS[item.category]),
      title: copy.title,
      description: copy.description,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? unlocked[item.id] : null,
      reconciled: isUnlocked && reconciled.has(item.id),
      unlockedDate: isUnlocked && !reconciled.has(item.id) ? formatAchievementUnlockDate(unlocked[item.id], locale) : null,
      displayType: isUnlocked ? 'unlocked' : (metric ? 'progress' : 'locked'),
      currentValue: current,
      targetValue: total,
      progress: metric && total > 0 ? Math.min(1, current / total) : null
    });
  });

  const order = new Map(items.map((item, index) => [item.id, index]));
  // Verrouillés : les plus avancés d'abord (ratio de progression décroissant), puis ceux sans compteur dans l'ordre du catalogue.
  const byProximity = (a, b) => {
    const pa = a.progress == null ? -1 : a.progress;
    const pb = b.progress == null ? -1 : b.progress;
    return pb - pa || order.get(a.id) - order.get(b.id);
  };
  // Débloqués : les plus récents d'abord.
  // Les succès rattrapés (date inconnue) passent après les autres.
  const recency = item => (item.reconciled ? '' : String(item.unlockedAt));
  const byRecent = (a, b) => recency(b).localeCompare(recency(a)) || order.get(a.id) - order.get(b.id);

  const lockedItems = items.filter(item => !item.unlocked);
  const started = lockedItems.filter(item => item.progress != null && item.progress > 0 && item.progress < 1).sort(byProximity);
  // Prochain succès : le plus proche d'être obtenu ; sinon le premier succès accessible (hors hardcore).
  const next = started[0]
    || lockedItems.find(item => item.category !== 'hardcore')
    || lockedItems[0]
    || null;

  return Object.freeze({
    items: Object.freeze(items),
    next,
    categories: Object.freeze(
      Object.keys(ACHIEVEMENT_CATEGORIES).map(category => {
        const own = items.filter(item => item.category === category);
        const locked = own.filter(item => !item.unlocked).sort(byProximity);
        const done = own.filter(item => item.unlocked).sort(byRecent);
        return Object.freeze({
          id: category,
          label: translate(CATEGORY_TRANSLATION_KEYS[category]),
          items: Object.freeze(own),
          locked: Object.freeze(locked),
          unlocked: Object.freeze(done),
          unlockedCount: done.length,
          totalCount: own.length
        });
      })
    ),
    unlockedCount: items.filter(item => item.unlocked).length,
    totalCount: items.length
  });
}
