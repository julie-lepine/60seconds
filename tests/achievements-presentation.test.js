import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS } from '../src/achievements/catalog.js';
import {
  buildAchievementPresentation,
  formatAchievementUnlockDate
} from '../src/achievements/presentation.js';
import { createEmptyProgress } from '../src/achievements/progress.js';

const translate = key => key;
const HISTORICAL_TYPES = [
  'tap', 'math', 'timing', 'oddoneout', 'reaction', 'memory', 'greater',
  'count', 'evenodd', 'leftright', 'goNoGo', 'sequence', 'direction', 'stroop'
];

function project(progress = createEmptyProgress(), overrides = {}){
  return buildAchievementPresentation({
    progress,
    streakCount: 0,
    bestScore: 0,
    locale: 'fr',
    translate,
    ...overrides
  });
}

function byId(result, id){
  return result.items.find(item => item.id === id);
}

const VISIBLE_WHEN_LOCKED = ACHIEVEMENTS
  .map(item => item.id)
  .filter(id => id !== 'return_after_7_days');

test('presentation projects visible achievements in catalog and category order', () => {
  const result = project();
  assert.equal(result.items.length, 30);
  assert.equal(byId(result, 'return_after_7_days'), undefined);
  assert.deepEqual(result.items.map(item => item.id), VISIBLE_WHEN_LOCKED);
  assert.deepEqual(result.categories.map(category => category.id), [
    'consistency', 'scores', 'mastery', 'experience'
  ]);
  assert.equal(result.categories.flatMap(category => category.items).length, 30);
});

test('Retour en piste stays hidden until it is unlocked, then keeps catalog order', () => {
  const progress = createEmptyProgress();
  progress.unlocked.return_after_7_days = '2026-10-05T12:00:00.000Z';
  const result = project(progress);
  const item = byId(result, 'return_after_7_days');

  assert.equal(result.items.length, 31);
  assert.equal(item.unlocked, true);
  assert.equal(item.displayType, 'unlocked');
  assert.deepEqual(
    result.items.map(entry => entry.id),
    ACHIEVEMENTS.map(entry => entry.id)
  );
});

test('global counter uses only persisted unlocked IDs for 0/30 and 31/31', () => {
  const empty = project();
  assert.equal(empty.unlockedCount, 0);
  assert.equal(empty.totalCount, 30);

  const progress = createEmptyProgress();
  for(const item of ACHIEVEMENTS){
    progress.unlocked[item.id] = '2026-10-05T12:00:00.000Z';
  }
  progress.unlocked.unknown_future_id = '2026-10-05T12:00:00.000Z';
  const complete = project(progress);
  assert.equal(complete.unlockedCount, 31);
  assert.equal(complete.totalCount, 31);
});

test('unlocked state and date come directly from persisted progress', () => {
  const progress = createEmptyProgress();
  const unlockedAt = '2026-10-05T12:00:00.000Z';
  progress.unlocked.first_game = unlockedAt;
  const item = byId(project(progress), 'first_game');

  assert.equal(item.unlocked, true);
  assert.equal(item.unlockedAt, unlockedAt);
  assert.equal(item.unlockedDate, formatAchievementUnlockDate(unlockedAt, 'fr'));
  assert.equal(item.displayType, 'unlocked');
});

test('approved cumulative families expose bounded progress with catalog targets', () => {
  const fresh = project();
  assert.equal(byId(fresh, 'new_record').displayType, 'progress');
  assert.deepEqual(
    [byId(fresh, 'new_record').currentValue, byId(fresh, 'new_record').targetValue],
    [0, 1]
  );
  assert.deepEqual(
    [byId(fresh, 'records_5').currentValue, byId(fresh, 'records_5').targetValue],
    [0, 5]
  );

  const progress = createEmptyProgress();
  progress.stats.dailyCompleted = 12;
  progress.stats.recordsBroken = 8;
  progress.stats.gamesCompleted = 75;
  progress.stats.playSeconds = 5000;
  const result = project(progress, { streakCount: 9, bestScore: 15000 });

  assert.deepEqual(
    [byId(result, 'streak_14').currentValue, byId(result, 'streak_14').targetValue],
    [9, 14]
  );
  assert.deepEqual(
    [byId(result, 'daily_30').currentValue, byId(result, 'daily_30').targetValue],
    [12, 30]
  );
  assert.deepEqual(
    [byId(result, 'score_12000').currentValue, byId(result, 'score_12000').targetValue],
    [12000, 12000]
  );
  assert.deepEqual(
    [byId(result, 'new_record').currentValue, byId(result, 'new_record').targetValue],
    [1, 1]
  );
  assert.deepEqual(
    [byId(result, 'records_5').currentValue, byId(result, 'records_5').targetValue],
    [5, 5]
  );
  assert.deepEqual(
    [byId(result, 'games_100').currentValue, byId(result, 'games_100').targetValue],
    [75, 100]
  );
  assert.deepEqual(
    [byId(result, 'seconds_3600').currentValue, byId(result, 'seconds_3600').targetValue],
    [3600, 3600]
  );
  assert.equal(byId(result, 'score_12000').progress, 1);
});

test('an unlocked streak remains unlocked with its date after current streak returns to zero', () => {
  const progress = createEmptyProgress();
  progress.unlocked.streak_7 = '2026-09-01T09:00:00.000Z';
  const item = byId(project(progress, { streakCount: 0 }), 'streak_7');

  assert.equal(item.displayType, 'unlocked');
  assert.equal(item.currentValue, 7);
  assert.equal(item.targetValue, 7);
  assert.ok(item.unlockedDate);
});

test('historical collections remain 0/14, 13/14 and 14/14 with future types ignored', () => {
  const empty = project();
  assert.deepEqual(
    [byId(empty, 'all_seen_v1').currentValue, byId(empty, 'all_seen_v1').targetValue],
    [0, 14]
  );

  const partialProgress = createEmptyProgress();
  partialProgress.stats.seenTypes = [...HISTORICAL_TYPES.slice(0, 13), 'futureChallenge'];
  const partial = project(partialProgress);
  assert.deepEqual(
    [byId(partial, 'all_seen_v1').currentValue, byId(partial, 'all_seen_v1').targetValue],
    [13, 14]
  );

  const completeProgress = createEmptyProgress();
  completeProgress.stats.seenTypes = [...HISTORICAL_TYPES, 'futureChallenge'];
  completeProgress.stats.succeededTypes = [...HISTORICAL_TYPES, 'anotherFutureChallenge'];
  const complete = project(completeProgress);
  assert.deepEqual(
    [byId(complete, 'all_seen_v1').currentValue, byId(complete, 'all_seen_v1').targetValue],
    [14, 14]
  );
  assert.deepEqual(
    [byId(complete, 'all_succeeded_v1').currentValue, byId(complete, 'all_succeeded_v1').targetValue],
    [14, 14]
  );
});

test('binary achievements never expose artificial progress', () => {
  const result = project();
  const binaryIds = [
    'complete_weekend',
    'first_game',
    'no_error',
    'insane_5',
    'timing_exact'
  ];

  for(const id of binaryIds){
    const item = byId(result, id);
    assert.equal(item.displayType, 'locked', id);
    assert.equal(item.currentValue, null, id);
    assert.equal(item.targetValue, null, id);
    assert.equal(item.progress, null, id);
  }
});
