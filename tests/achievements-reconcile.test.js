import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyProgress, reconcileScoreAchievements } from '../src/achievements/progress.js';

const NOW = '2026-11-03T21:00:00.000Z';

test('un record déjà atteint débloque les succès de score manquants', () => {
  const progress = createEmptyProgress('2026-10-01T00:00:00.000Z');
  progress.unlocked.score_1000 = '2026-10-02T10:00:00.000Z';
  const { progress: next, added } = reconcileScoreAchievements(progress, { bestScore: 6540 }, NOW);
  for(const id of ['score_2500', 'score_4000', 'score_6000']){
    assert.equal(next.unlocked[id], NOW, id);
    assert.ok(added.includes(id));
  }
  assert.equal(next.unlocked.score_8000, undefined, '8 000 pas atteint');
  assert.equal(next.unlocked.score_1000, '2026-10-02T10:00:00.000Z', 'une date existante n’est pas écrasée');
  assert.equal(progress.unlocked.score_4000, undefined, 'l’entrée n’est pas modifiée');
});

test('le record hardcore rattrape ses propres succès, pas ceux du jeu normal', () => {
  const { progress: next } = reconcileScoreAchievements(createEmptyProgress(), { bestScore: 0, hardcoreBestScore: 2300 }, NOW);
  assert.ok(next.unlocked.hardcore_first_game);
  assert.ok(next.unlocked.hardcore_score_2000);
  assert.equal(next.unlocked.hardcore_score_4000, undefined);
  assert.equal(next.unlocked.score_1000, undefined);
  assert.equal(next.unlocked.first_game, undefined);
});

test('sans record, rien n’est débloqué ; idempotent', () => {
  const empty = reconcileScoreAchievements(createEmptyProgress(), {}, NOW);
  assert.deepEqual(empty.added, []);
  const once = reconcileScoreAchievements(createEmptyProgress(), { bestScore: 4000 }, NOW).progress;
  assert.deepEqual(reconcileScoreAchievements(once, { bestScore: 4000 }, NOW).added, []);
});
