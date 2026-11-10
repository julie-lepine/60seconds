import { ACHIEVEMENTS } from './catalog.js';
import { countScopeProgress } from './scopes.js';

export const PROGRESS_VERSION = 1;
export const COMPLETED_GAME_SECONDS = 60;
// Gel de série : 1 gel gagné tous les 7 jours de série, 2 en stock au maximum.
// Un gel couvre un jour manqué ; il n'est consommé que s'il sauve réellement la série.
export const STREAK_FREEZE_EVERY = 7;
export const STREAK_FREEZE_CAP = 2;

function safeInteger(value){
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function uniqueStrings(value){
  if(!Array.isArray(value)) return [];
  return [...new Set(value.filter(item => typeof item === 'string' && item.length > 0))];
}

export function localDateKey(now = new Date()){
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function utcDateKey(now = new Date()){
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateOrdinal(key){
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  if(!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(Date.UTC(y, m - 1, d));
  if(date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return Math.floor(date.getTime() / 86400000);
}

function normalizeDateKey(value){
  return dateOrdinal(value) == null ? null : String(value);
}

function normalizeUnlocked(value){
  if(!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const unlocked = {};
  for(const [id, date] of Object.entries(value)){
    if(!/^[a-z0-9_]+$/.test(id)) continue;
    if(typeof date !== 'string' || !Number.isFinite(Date.parse(date))) continue;
    unlocked[id] = date;
  }
  return unlocked;
}

export function createEmptyProgress(createdAt = new Date().toISOString()){
  return {
    version: PROGRESS_VERSION,
    createdAt,
    migratedAt: null,
    unlocked: {},
    // Succès débloqués par rattrapage (record ou migration) : leur vraie date est inconnue, on ne l'affiche pas.
    reconciled: [],
    stats: {
      gamesCompleted: 0,
      playSeconds: 0,
      dailyCompleted: 0,
      lastCountedDailyDate: null,
      recordsBroken: 0,
      seenTypes: [],
      succeededTypes: [],
      currentStreak: 0,
      longestStreak: 0,
      streakFreezes: 0,
      lastPlayedLocalDate: null,
      hardcoreGames: 0,
      hardcoreRecordsBroken: 0,
      hardcoreSucceededTypes: []
    }
  };
}

export function normalizeProgress(raw){
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)){
    return { status: 'invalid', progress: null };
  }
  if(!Number.isInteger(raw.version)){
    return { status: 'invalid', progress: null };
  }
  if(raw.version > PROGRESS_VERSION){
    return { status: 'future', progress: null };
  }
  if(raw.version !== PROGRESS_VERSION){
    return { status: 'invalid', progress: null };
  }

  const defaults = createEmptyProgress();
  const stats = raw.stats && typeof raw.stats === 'object' && !Array.isArray(raw.stats) ? raw.stats : {};
  const currentStreak = safeInteger(stats.currentStreak);
  const longestStreak = Math.max(currentStreak, safeInteger(stats.longestStreak));
  const createdAt = typeof raw.createdAt === 'string' && Number.isFinite(Date.parse(raw.createdAt))
    ? raw.createdAt
    : defaults.createdAt;
  const migratedAt = typeof raw.migratedAt === 'string' && Number.isFinite(Date.parse(raw.migratedAt))
    ? raw.migratedAt
    : null;

  const unlocked = normalizeUnlocked(raw.unlocked);

  return {
    status: 'valid',
    progress: {
      version: PROGRESS_VERSION,
      createdAt,
      migratedAt,
      unlocked,
      reconciled: uniqueStrings(raw.reconciled).filter(id => typeof unlocked[id] === 'string'),
      stats: {
        gamesCompleted: safeInteger(stats.gamesCompleted),
        playSeconds: safeInteger(stats.playSeconds),
        dailyCompleted: safeInteger(stats.dailyCompleted),
        lastCountedDailyDate: normalizeDateKey(stats.lastCountedDailyDate),
        recordsBroken: safeInteger(stats.recordsBroken),
        seenTypes: uniqueStrings(stats.seenTypes),
        succeededTypes: uniqueStrings(stats.succeededTypes),
        currentStreak,
        longestStreak,
        streakFreezes: Math.min(STREAK_FREEZE_CAP, safeInteger(stats.streakFreezes)),
        lastPlayedLocalDate: normalizeDateKey(stats.lastPlayedLocalDate),
        hardcoreGames: safeInteger(stats.hardcoreGames),
        hardcoreRecordsBroken: safeInteger(stats.hardcoreRecordsBroken),
        hardcoreSucceededTypes: uniqueStrings(stats.hardcoreSucceededTypes)
      }
    }
  };
}

function validatedScore(value){
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 ? score : 0;
}

function isValidScore(value){
  const score = Number(value);
  return Number.isFinite(score) && score >= 0;
}

function validatedLegacyStreak(value){
  if(!value || typeof value !== 'object') return null;
  const currentStreak = value.currentStreak;
  const lastPlayedLocalDate = normalizeDateKey(value.lastCompletedLocalDate);
  if(!Number.isSafeInteger(currentStreak) || currentStreak < 0) return null;
  if(currentStreak > 0 && !lastPlayedLocalDate) return null;
  return { currentStreak, lastPlayedLocalDate };
}

export function migrateLegacyProgress(legacy = {}, migratedAt = new Date().toISOString()){
  const progress = createEmptyProgress(migratedAt);
  progress.migratedAt = migratedAt;

  const normalBest = validatedScore(legacy.normalBest);
  const dailyBest = validatedScore(legacy.dailyBest);
  const bestScore = Math.max(normalBest, dailyBest);
  const legacyStreak = validatedLegacyStreak(legacy.streak);
  const dailyRun = legacy.dailyRun;

  if(legacyStreak){
    progress.stats.currentStreak = legacyStreak.currentStreak;
    progress.stats.longestStreak = legacyStreak.currentStreak;
    progress.stats.lastPlayedLocalDate = legacyStreak.lastPlayedLocalDate;
  }

  if(
    dailyRun &&
    typeof dailyRun === 'object' &&
    normalizeDateKey(dailyRun.date) &&
    isValidScore(dailyRun.score)
  ){
    progress.stats.dailyCompleted = 1;
    progress.stats.lastCountedDailyDate = String(dailyRun.date);
  }

  for(const item of ACHIEVEMENTS){
    const unlockFromScore = item.condition === 'score' && bestScore >= item.params.score;
    const unlockFirstGame = item.id === 'first_game' && bestScore > 0;
    const unlockFromStreak = item.condition === 'streak' && legacyStreak && legacyStreak.currentStreak >= item.params.days;
    if(unlockFromScore || unlockFirstGame || unlockFromStreak){
      progress.unlocked[item.id] = migratedAt;
      progress.reconciled.push(item.id);
    }
  }
  return progress;
}

// Rattrapage : les records enregistrés font foi. Un succès de score dont le seuil est déjà couvert par un record
// (jeu normal / quotidien, ou hardcore) est débloqué même si la partie correspondante ne l'a pas évalué
// (ancienne version, seuil ajouté plus tard, donnée importée…).
export function reconcileScoreAchievements(progress, { bestScore = 0, hardcoreBestScore = 0 } = {}, now = new Date().toISOString()){
  const normalBest = validatedScore(bestScore);
  const hardcoreBest = validatedScore(hardcoreBestScore);
  const next = cloneProgress(progress);
  const added = [];
  for(const item of ACHIEVEMENTS){
    if(next.unlocked[item.id]) continue;
    const fromScore = item.condition === 'score' && normalBest >= item.params.score;
    const fromHardcoreScore = item.condition === 'hardcoreScore' && hardcoreBest >= item.params.score;
    const fromHardcoreGame = item.id === 'hardcore_first_game' && hardcoreBest > 0;
    if(fromScore || fromHardcoreScore || fromHardcoreGame){
      next.unlocked[item.id] = now;
      next.reconciled = uniqueStrings([...next.reconciled, item.id]);
      added.push(item.id);
    }
  }
  return { progress: next, added };
}

function cloneProgress(progress){
  return {
    ...progress,
    unlocked: { ...progress.unlocked },
    reconciled: [...(progress.reconciled || [])],
    stats: {
      ...progress.stats,
      seenTypes: [...progress.stats.seenTypes],
      succeededTypes: [...progress.stats.succeededTypes],
      hardcoreSucceededTypes: [...(progress.stats.hardcoreSucceededTypes || [])]
    }
  };
}

export function buildCompletionCandidate(previous, session, completion){
  const candidate = cloneProgress(previous);
  const previousStats = previous.stats;
  const stats = candidate.stats;
  const localDate = normalizeDateKey(completion.localDate) || localDateKey();
  const dailyDate = normalizeDateKey(completion.dailyDate) || utcDateKey();
  const previousDay = dateOrdinal(previousStats.lastPlayedLocalDate);
  const currentDay = dateOrdinal(localDate);
  const dayDifference = previousDay != null && currentDay != null ? currentDay - previousDay : null;
  const missedDays = dayDifference != null && dayDifference > 0 ? Math.max(0, dayDifference - 1) : 0;

  stats.gamesCompleted += 1;
  stats.playSeconds += COMPLETED_GAME_SECONDS;
  stats.seenTypes = uniqueStrings([...stats.seenTypes, ...session.seenTypes]);
  // Une partie hardcore compte pour l'activité (série, parties, temps de jeu, types vus) ;
  // ses réussites et son record alimentent des compteurs séparés.
  const isHardcore = session.mode === 'hardcore';
  if(isHardcore){
    stats.hardcoreGames += 1;
    stats.hardcoreSucceededTypes = uniqueStrings([...stats.hardcoreSucceededTypes, ...session.succeededTypes]);
  }else{
    stats.succeededTypes = uniqueStrings([...stats.succeededTypes, ...session.succeededTypes]);
  }

  if(session.mode === 'daily' && stats.lastCountedDailyDate !== dailyDate){
    stats.dailyCompleted += 1;
    stats.lastCountedDailyDate = dailyDate;
  }

  const recordBroken = !!completion.recordBroken && Number(completion.previousBest) > 0;
  if(recordBroken){
    if(isHardcore) stats.hardcoreRecordsBroken += 1;
    else stats.recordsBroken += 1;
  }

  let freezeUsed = 0;
  let freezeEarned = false;
  if(dayDifference == null){
    stats.currentStreak = 1;
    stats.lastPlayedLocalDate = localDate;
  }else if(dayDifference === 0){
    // A second completed game on the same local day leaves the streak unchanged.
  }else if(dayDifference === 1){
    stats.currentStreak = Math.max(1, stats.currentStreak + 1);
    stats.lastPlayedLocalDate = localDate;
  }else if(dayDifference > 1){
    // Jours manqués : les gels en stock sauvent la série s'ils couvrent tout l'écart.
    const gap = dayDifference - 1;
    if(stats.currentStreak > 0 && stats.streakFreezes >= gap){
      stats.streakFreezes -= gap;
      freezeUsed = gap;
      stats.currentStreak = Math.max(1, stats.currentStreak + 1);
    }else{
      stats.currentStreak = 1;
    }
    stats.lastPlayedLocalDate = localDate;
  }
  // Un nouveau palier de 7 jours rapporte un gel (dans la limite du stock).
  if(stats.lastPlayedLocalDate === localDate && dayDifference != null && dayDifference > 0
    && stats.currentStreak % STREAK_FREEZE_EVERY === 0 && stats.streakFreezes < STREAK_FREEZE_CAP){
    stats.streakFreezes += 1;
    freezeEarned = true;
  }
  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);

  const previousDate = previousStats.lastPlayedLocalDate;
  const previousWasSaturday = previousDate
    ? new Date(`${previousDate}T12:00:00`).getDay() === 6
    : false;
  const currentIsSunday = new Date(`${localDate}T12:00:00`).getDay() === 0;

  return {
    candidate,
    completedSession: {
      ...session,
      score: validatedScore(completion.score),
      completedAt: completion.completedAt,
      localDate,
      dailyDate,
      recordBroken,
      missedDays,
      freezeUsed,
      freezeEarned,
      completedWeekend: dayDifference === 1 && previousWasSaturday && currentIsSunday
    }
  };
}

// Conditions de performance du jeu normal : une partie hardcore ne les déclenche pas.
const NORMAL_PERFORMANCE_CONDITIONS = new Set([
  'score', 'recordBroken', 'noError', 'insaneCount', 'timingExact'
]);

function achievementConditionMet(item, previous, candidate, session){
  const hardcore = session.mode === 'hardcore';
  if(hardcore && NORMAL_PERFORMANCE_CONDITIONS.has(item.condition)) return false;
  switch(item.condition){
    case 'streak':
      return candidate.stats.currentStreak >= item.params.days;
    case 'returnAfterBreak':
      return session.missedDays >= item.params.missedDays;
    case 'completeWeekend':
      return session.completedWeekend;
    case 'dailyCount':
      return candidate.stats.dailyCompleted >= item.params.count;
    case 'gamesCount':
      return candidate.stats.gamesCompleted >= item.params.count;
    case 'score':
      return session.score >= item.params.score;
    case 'recordBroken':
      return session.recordBroken;
    case 'recordsCount':
      return candidate.stats.recordsBroken >= item.params.count;
    case 'noError':
      return session.challengesResolved > 0 && session.errors === 0;
    case 'insaneCount':
      return session.insaneCount >= item.params.count;
    case 'scopeSeen':
      return countScopeProgress(candidate.stats.seenTypes, item.params.scopeId).complete;
    case 'scopeSucceeded':
      return countScopeProgress(candidate.stats.succeededTypes, item.params.scopeId).complete;
    case 'timingExact':
      return session.timingExact === true;
    case 'secondsCount':
      return candidate.stats.playSeconds >= item.params.seconds;
    case 'hardcoreGamesCount':
      return candidate.stats.hardcoreGames >= item.params.count;
    case 'hardcoreRecordsCount':
      return candidate.stats.hardcoreRecordsBroken >= item.params.count;
    case 'hardcoreScopeSucceeded':
      return countScopeProgress(candidate.stats.hardcoreSucceededTypes, item.params.scopeId).complete;
    case 'hardcoreScore':
      return hardcore && session.score >= item.params.score;
    case 'hardcoreNoError':
      return hardcore && session.challengesResolved > 0 && session.errors === 0;
    case 'hardcoreComeback':
      return hardcore && session.floorReached === true && session.score >= item.params.score;
    case 'hardcoreNoMercy':
      return hardcore && session.errors >= item.params.errors && session.score >= item.params.score;
    case 'hardcoreSuccessStreak':
      return hardcore && session.bestSuccessStreak >= item.params.count;
    case 'hardcoreInsaneCount':
      return hardcore && session.insaneCount >= item.params.count;
    case 'hardcoreTimingExact':
      return hardcore && session.timingExact === true;
    default:
      return false;
  }
}

export function evaluateAchievements(previous, candidate, session, catalog = ACHIEVEMENTS){
  const finalProgress = cloneProgress(candidate);
  const newlyUnlocked = [];
  const unlockedAt = typeof session.completedAt === 'string' && Number.isFinite(Date.parse(session.completedAt))
    ? session.completedAt
    : new Date().toISOString();

  for(const item of catalog){
    if(finalProgress.unlocked[item.id]) continue;
    if(!achievementConditionMet(item, previous, finalProgress, session)) continue;
    finalProgress.unlocked[item.id] = unlockedAt;
    newlyUnlocked.push(item);
  }

  return { progress: finalProgress, newlyUnlocked };
}

export function getEffectiveStreak(progress, now = new Date()){
  const today = dateOrdinal(localDateKey(now));
  const last = dateOrdinal(progress?.stats?.lastPlayedLocalDate);
  const daysSince = today != null && last != null ? today - last : null;
  const freezes = Math.min(STREAK_FREEZE_CAP, safeInteger(progress?.stats?.streakFreezes));
  // Un gel en stock maintient la série affichée tant qu'il couvre l'écart (elle est sauvée à la prochaine partie).
  const active = daysSince != null && daysSince >= 0
    && (daysSince <= 1 || (daysSince - 1 <= freezes && safeInteger(progress?.stats?.currentStreak) > 0));
  return {
    count: active ? safeInteger(progress?.stats?.currentStreak) : 0,
    freezes,
    completedToday: daysSince === 0,
    longest: safeInteger(progress?.stats?.longestStreak),
    lastCompletedLocalDate: progress?.stats?.lastPlayedLocalDate || null
  };
}
