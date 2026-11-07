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

test('les succès rattrapés sont marqués et survivent à la normalisation', async () => {
  const { normalizeProgress, migrateLegacyProgress } = await import('../src/achievements/progress.js');
  const { progress: next } = reconcileScoreAchievements(createEmptyProgress(), { bestScore: 2600 }, NOW);
  assert.deepEqual([...next.reconciled].sort(), ['score_1000', 'score_2500']);
  const again = normalizeProgress(JSON.parse(JSON.stringify(next))).progress;
  assert.deepEqual([...again.reconciled].sort(), ['score_1000', 'score_2500']);

  const orphan = JSON.parse(JSON.stringify(next));
  orphan.reconciled.push('score_8000', 42);
  assert.deepEqual(normalizeProgress(orphan).progress.reconciled.sort(), ['score_1000', 'score_2500'], 'ids non débloqués ou invalides retirés');

  const migrated = migrateLegacyProgress({ normalBest: 1200 }, NOW);
  assert.ok(migrated.reconciled.includes('score_1000'), 'la migration marque aussi ses déblocages');
});

test('la présentation masque la date d’un succès rattrapé et le range après les autres', async () => {
  const { buildAchievementPresentation } = await import('../src/achievements/presentation.js');
  const progress = createEmptyProgress('2026-10-01T00:00:00.000Z');
  progress.unlocked.score_1000 = '2026-11-07T10:00:00.000Z';
  progress.unlocked.streak_2 = '2026-11-06T10:00:00.000Z';
  progress.unlocked.streak_7 = '2026-11-01T10:00:00.000Z';
  progress.reconciled = ['score_1000'];
  const result = buildAchievementPresentation({ progress, translate: key => key, locale: 'fr' });
  const byId = Object.fromEntries(result.items.map(item => [item.id, item]));
  assert.equal(byId.score_1000.reconciled, true);
  assert.equal(byId.score_1000.unlockedDate, null);
  assert.ok(byId.streak_2.unlockedDate);
  assert.equal(byId.streak_2.reconciled, false);
  const consistency = result.categories.find(category => category.id === 'consistency');
  assert.deepEqual(consistency.unlocked.map(item => item.id), ['streak_2', 'streak_7']);
  const scores = result.categories.find(category => category.id === 'scores');
  assert.equal(scores.unlocked[0].id, 'score_1000');
});
