import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompletionCandidate,
  createEmptyProgress,
  evaluateAchievements,
  migrateLegacyProgress,
  normalizeProgress
} from '../src/achievements/progress.js';

const COMPLETED_AT = '2026-10-05T08:00:00.000Z';

function session(overrides = {}){
  return {
    sessionId: 'session-1',
    mode: 'normal',
    startedAt: 1,
    status: 'finalizing',
    challengesResolved: 1,
    errors: 0,
    insaneCount: 0,
    seenTypes: ['math'],
    succeededTypes: ['math'],
    timingAttempts: [],
    timingExact: false,
    ...overrides
  };
}

function finish(previous, sessionOverrides = {}, completionOverrides = {}){
  const built = buildCompletionCandidate(previous, session(sessionOverrides), {
    score: 500,
    previousBest: 0,
    recordBroken: true,
    localDate: '2026-10-05',
    dailyDate: '2026-10-05',
    completedAt: COMPLETED_AT,
    ...completionOverrides
  });
  return evaluateAchievements(previous, built.candidate, built.completedSession);
}

test('one completed game produces one complete candidate without mutating previous progress', () => {
  const previous = createEmptyProgress('2026-10-01T00:00:00.000Z');
  const result = finish(previous);
  assert.equal(previous.stats.gamesCompleted, 0);
  assert.equal(result.progress.stats.gamesCompleted, 1);
  assert.equal(result.progress.stats.playSeconds, 60);
  assert.equal(result.progress.stats.currentStreak, 1);
  assert.deepEqual(result.progress.stats.seenTypes, ['math']);
  assert.deepEqual(result.progress.stats.succeededTypes, ['math']);
  assert.ok(result.progress.unlocked.first_game);
});

test('first record does not count as Nouveau record, equality and lower scores do not count either', () => {
  const empty = createEmptyProgress();
  const first = finish(empty, {}, { score: 900, previousBest: 0, recordBroken: true });
  assert.equal(first.progress.stats.recordsBroken, 0);
  assert.equal(first.progress.unlocked.new_record, undefined);

  const equal = finish(first.progress, {}, { score: 900, previousBest: 900, recordBroken: false });
  assert.equal(equal.progress.stats.recordsBroken, 0);
  const lower = finish(equal.progress, {}, { score: 800, previousBest: 900, recordBroken: false });
  assert.equal(lower.progress.stats.recordsBroken, 0);
});

test('Normal and Daily records feed the same counter and the fifth unlocks Record en série', () => {
  const previous = createEmptyProgress();
  previous.stats.recordsBroken = 4;
  const result = finish(
    previous,
    { mode: 'daily' },
    { score: 3000, previousBest: 2500, recordBroken: true }
  );
  assert.equal(result.progress.stats.recordsBroken, 5);
  assert.ok(result.progress.unlocked.new_record);
  assert.ok(result.progress.unlocked.records_5);
});

test('several achievements can unlock from the same finalization', () => {
  const previous = createEmptyProgress();
  const result = finish(
    previous,
    {
      challengesResolved: 6,
      insaneCount: 5,
      seenTypes: ['timing'],
      succeededTypes: ['timing'],
      timingExact: true
    },
    { score: 5200 }
  );
  const ids = result.newlyUnlocked.map(item => item.id);
  assert.ok(ids.includes('first_game'));
  assert.ok(ids.includes('score_1000'));
  assert.ok(ids.includes('score_2500'));
  assert.ok(ids.includes('score_5000'));
  assert.ok(ids.includes('no_error'));
  assert.ok(ids.includes('insane_5'));
  assert.ok(ids.includes('timing_exact'));
});

test('same local day does not increment streak and the next day does', () => {
  const previous = createEmptyProgress();
  previous.stats.currentStreak = 4;
  previous.stats.longestStreak = 4;
  previous.stats.lastPlayedLocalDate = '2026-10-05';

  const sameDay = finish(previous, {}, { localDate: '2026-10-05' });
  assert.equal(sameDay.progress.stats.currentStreak, 4);
  const nextDay = finish(sameDay.progress, {}, { localDate: '2026-10-06' });
  assert.equal(nextDay.progress.stats.currentStreak, 5);
  assert.equal(nextDay.progress.stats.longestStreak, 5);
});

test('seven fully missed local days unlock Retour en piste', () => {
  const previous = createEmptyProgress();
  previous.stats.currentStreak = 3;
  previous.stats.longestStreak = 3;
  previous.stats.lastPlayedLocalDate = '2026-10-01';
  const result = finish(previous, {}, { localDate: '2026-10-09' });
  assert.equal(result.progress.stats.currentStreak, 1);
  assert.ok(result.progress.unlocked.return_after_7_days);
});

test('Saturday followed by Sunday unlocks Week-end complet across a year boundary', () => {
  const previous = createEmptyProgress();
  previous.stats.currentStreak = 1;
  previous.stats.longestStreak = 1;
  previous.stats.lastPlayedLocalDate = '2022-12-31';
  const result = finish(previous, {}, { localDate: '2023-01-01' });
  assert.ok(result.progress.unlocked.complete_weekend);
});

test('Daily completion is counted once per Daily date', () => {
  const previous = createEmptyProgress();
  const first = finish(previous, { mode: 'daily' }, { dailyDate: '2026-10-05' });
  const duplicate = finish(first.progress, { mode: 'daily' }, { dailyDate: '2026-10-05' });
  assert.equal(first.progress.stats.dailyCompleted, 1);
  assert.equal(duplicate.progress.stats.dailyCompleted, 1);
});

test('future challenge IDs are retained but do not complete historical scopes', () => {
  const historical = [
    'tap', 'math', 'timing', 'oddoneout', 'reaction', 'memory', 'greater',
    'count', 'evenodd', 'leftright', 'goNoGo', 'sequence', 'direction'
  ];
  const previous = createEmptyProgress();
  previous.stats.seenTypes = historical;
  previous.stats.succeededTypes = historical;
  const result = finish(previous, {
    seenTypes: ['futureChallenge'],
    succeededTypes: ['futureChallenge']
  });
  assert.equal(result.progress.unlocked.all_seen_v1, undefined);
  assert.equal(result.progress.unlocked.all_succeeded_v1, undefined);
  assert.ok(result.progress.stats.seenTypes.includes('futureChallenge'));
});

test('all 14 historical challenge IDs unlock Tout vu and Tous terrains', () => {
  const allTypes = [
    'tap', 'math', 'timing', 'oddoneout', 'reaction', 'memory', 'greater',
    'count', 'evenodd', 'leftright', 'goNoGo', 'sequence', 'direction', 'stroop'
  ];
  const result = finish(createEmptyProgress(), {
    challengesResolved: 14,
    seenTypes: allTypes,
    succeededTypes: allTypes
  });
  assert.ok(result.progress.unlocked.all_seen_v1);
  assert.ok(result.progress.unlocked.all_succeeded_v1);
});

test('migration recovers only certain score and streak achievements', () => {
  const migrated = migrateLegacyProgress({
    normalBest: 6200,
    dailyBest: 3100,
    streak: {
      currentStreak: 16,
      lastCompletedLocalDate: '2026-10-04'
    },
    dailyRun: { date: '2026-10-05', score: 1200 }
  }, COMPLETED_AT);

  assert.ok(migrated.unlocked.first_game);
  assert.ok(migrated.unlocked.score_1000);
  assert.ok(migrated.unlocked.score_2500);
  assert.ok(migrated.unlocked.score_5000);
  assert.equal(migrated.unlocked.score_8000, undefined);
  assert.ok(migrated.unlocked.streak_2);
  assert.ok(migrated.unlocked.streak_7);
  assert.ok(migrated.unlocked.streak_14);
  assert.equal(migrated.unlocked.new_record, undefined);
  assert.equal(migrated.unlocked.records_5, undefined);
  assert.equal(migrated.stats.gamesCompleted, 0);
  assert.equal(migrated.stats.recordsBroken, 0);
  assert.equal(migrated.stats.dailyCompleted, 1);
  assert.equal(migrated.unlocked.first_game, COMPLETED_AT);
});

test('invalid, partial and future progress are handled conservatively', () => {
  assert.equal(normalizeProgress(null).status, 'invalid');
  assert.equal(normalizeProgress({ version: 999 }).status, 'future');

  const partial = normalizeProgress({
    version: 1,
    stats: {
      gamesCompleted: -10,
      playSeconds: Number.POSITIVE_INFINITY,
      seenTypes: ['math', 'math', 42],
      currentStreak: 7,
      longestStreak: 3,
      lastPlayedLocalDate: 'invalid'
    },
    unlocked: {
      score_1000: 'not-a-date',
      first_game: COMPLETED_AT
    }
  });
  assert.equal(partial.status, 'valid');
  assert.equal(partial.progress.stats.gamesCompleted, 0);
  assert.equal(partial.progress.stats.playSeconds, 0);
  assert.deepEqual(partial.progress.stats.seenTypes, ['math']);
  assert.equal(partial.progress.stats.longestStreak, 7);
  assert.equal(partial.progress.stats.lastPlayedLocalDate, null);
  assert.deepEqual(partial.progress.unlocked, { first_game: COMPLETED_AT });
});
