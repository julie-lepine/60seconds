import test from 'node:test';
import assert from 'node:assert/strict';
import * as session from '../src/achievements/session.js';
import * as progress from '../src/achievements/progress.js';

function play(mode, steps, { floor = false } = {}){
  session.resetGameSessionForTests();
  session.createGameSession(mode);
  const types = ['count', 'math', 'timing'];
  steps.forEach((kind, i) => {
    const type = kind.type || types[i % types.length];
    const ctx = session.markChallengeShown(type);
    const meta = kind.timing ? { timing: kind.timing } : null;
    session.recordChallengeResult(ctx, kind.kind || kind, meta);
    if(floor && i === 0) session.markScoreFloorReached();
  });
  return session.getActiveGameSession();
}

function finish(snapshot, score, previous = progress.createEmptyProgress('2026-10-01T00:00:00.000Z'), recordBroken = false){
  const { candidate, completedSession } = progress.buildCompletionCandidate(previous, snapshot, {
    score, previousBest: 50, recordBroken,
    localDate: '2026-10-05', dailyDate: '2026-10-05', completedAt: '2026-10-05T12:00:00.000Z'
  });
  return progress.evaluateAchievements(previous, candidate, completedSession).progress;
}

test('suivi de session : meilleure série de réussites et passage à zéro', () => {
  const s = play('hardcore', ['good', 'good', 'insane', 'bad', 'good'], { floor: true });
  assert.equal(s.bestSuccessStreak, 3);
  assert.equal(s.floorReached, true);
  assert.equal(play('hardcore', ['good']).floorReached, false);
});

test('Intouchable, Série de 10 et Foudroyant en hardcore', () => {
  const p = finish(play('hardcore', Array(10).fill('insane')), 3000);
  assert.ok(p.unlocked.hardcore_no_error);
  assert.ok(p.unlocked.hardcore_streak_10);
  assert.ok(p.unlocked.hardcore_insane_8);
  assert.equal(p.unlocked.no_error, undefined);
  assert.equal(p.unlocked.insane_5, undefined);
});

test('Remontada exige d’être tombé à 0 puis d’atteindre 1 500', () => {
  const steps = ['bad', 'good', 'good'];
  assert.ok(finish(play('hardcore', steps, { floor: true }), 1500).unlocked.hardcore_comeback);
  assert.equal(finish(play('hardcore', steps, { floor: true }), 1499).unlocked.hardcore_comeback, undefined);
  assert.equal(finish(play('hardcore', steps), 3000).unlocked.hardcore_comeback, undefined);
});

test('Pas de cadeau : 2 000 points malgré 5 erreurs', () => {
  const steps = [...Array(5).fill('bad'), 'good'];
  assert.ok(finish(play('hardcore', steps), 2000).unlocked.hardcore_no_mercy);
  assert.equal(finish(play('hardcore', steps.slice(1)), 2500).unlocked.hardcore_no_mercy, undefined);
});

test('Chirurgical : timing parfait seulement en hardcore', () => {
  const exact = [{ kind: 'good', type: 'timing', timing: { targetDisplayed: '3.00', stoppedDisplayed: '3.00' } }];
  assert.ok(finish(play('hardcore', exact), 500).unlocked.hardcore_timing_exact);
  const normal = finish(play('normal', exact), 500);
  assert.equal(normal.unlocked.hardcore_timing_exact, undefined);
  assert.ok(normal.unlocked.timing_exact);
});

test('un score normal ne débloque pas les succès hardcore', () => {
  const p = finish(play('normal', ['good']), 7000);
  assert.ok(p.unlocked.score_6000);
  assert.equal(p.unlocked.hardcore_score_2000, undefined);
  assert.equal(p.unlocked.hardcore_first_game, undefined);
  assert.equal(p.stats.hardcoreGames, 0);
});

test('Record sous pression : 3 records hardcore cumulés, séparés du jeu normal', () => {
  let p = progress.createEmptyProgress('2026-10-01T00:00:00.000Z');
  for(let i = 0; i < 3; i++) p = finish(play('hardcore', ['good']), 100 + i, p, true);
  assert.equal(p.stats.hardcoreRecordsBroken, 3);
  assert.equal(p.stats.recordsBroken, 0);
  assert.ok(p.unlocked.hardcore_records_3);
  assert.equal(p.unlocked.new_record, undefined);
});

test('Sans faiblesse : réussites hardcore comptées à part', () => {
  const types = progress.createEmptyProgress().stats;
  assert.deepEqual(types.hardcoreSucceededTypes, []);
  const p = finish(play('hardcore', ['good']), 100);
  assert.deepEqual(p.stats.succeededTypes, []);
  assert.equal(p.stats.hardcoreSucceededTypes.length, 1);
  const normalized = progress.normalizeProgress(JSON.parse(JSON.stringify(p))).progress;
  assert.equal(normalized.stats.hardcoreGames, 1);
});
