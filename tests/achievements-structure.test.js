import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAchievementPresentation } from '../src/achievements/presentation.js';
import { createEmptyProgress } from '../src/achievements/progress.js';

const translate = key => key;
const project = (progress = createEmptyProgress(), extra = {}) =>
  buildAchievementPresentation({ progress, translate, locale: 'fr', ...extra });
const category = (result, id) => result.categories.find(item => item.id === id);

test('chaque catégorie sépare verrouillés et débloqués avec ses compteurs', () => {
  const progress = createEmptyProgress();
  progress.unlocked.streak_2 = '2026-10-01T10:00:00.000Z';
  progress.unlocked.streak_7 = '2026-10-05T10:00:00.000Z';
  const result = project(progress);
  const consistency = category(result, 'consistency');
  assert.equal(consistency.unlockedCount, 2);
  assert.equal(consistency.totalCount, 10, '« Retour en piste » reste caché');
  assert.deepEqual(consistency.unlocked.map(item => item.id), ['streak_7', 'streak_2'], 'débloqués : plus récent d’abord');
  assert.ok(consistency.locked.every(item => !item.unlocked));
  assert.equal(consistency.locked.length + consistency.unlocked.length, consistency.totalCount);
  assert.equal(result.categories.length, 5);
  assert.equal(result.categories.at(-1).id, 'hardcore');
});

test('verrouillés triés par proximité, ceux sans compteur à la suite', () => {
  const progress = createEmptyProgress();
  progress.stats.gamesCompleted = 9;
  progress.stats.playSeconds = 600;
  const result = project(progress, { streakCount: 1 });
  const ids = category(result, 'experience').locked.map(item => item.id);
  assert.equal(ids[0], 'games_10', '9/10 passe en premier');
  assert.ok(ids.indexOf('games_10') < ids.indexOf('games_50'));
  const noMetric = category(result, 'mastery').locked.filter(item => item.progress == null).map(item => item.id);
  assert.ok(noMetric.includes('no_error'));
});

test('prochain succès : le plus avancé, sinon le premier accessible hors hardcore', () => {
  const progress = createEmptyProgress();
  progress.stats.gamesCompleted = 40;
  progress.unlocked.games_10 = '2026-10-05T12:00:00.000Z';
  const best = project(progress).next;
  assert.equal(best.id, 'games_50');

  const fresh = project(createEmptyProgress()).next;
  assert.ok(fresh);
  assert.notEqual(fresh.category, 'hardcore');
  assert.equal(fresh.unlocked, false);
});

test('prochain succès : null quand tout est débloqué', () => {
  const full = createEmptyProgress();
  for(const item of project().items) full.unlocked[item.id] = '2026-10-05T12:00:00.000Z';
  full.unlocked.return_after_7_days = '2026-10-05T12:00:00.000Z';
  const result = project(full);
  assert.equal(result.next, null);
  assert.ok(result.categories.every(item => item.locked.length === 0));
});

test('la progression hardcore utilise le meilleur score hardcore', () => {
  const result = project(createEmptyProgress(), { hardcoreBestScore: 1000 });
  const item = category(result, 'hardcore').locked.find(entry => entry.id === 'hardcore_score_2000');
  assert.equal(item.currentValue, 1000);
  assert.equal(item.targetValue, 2000);
  assert.equal(item.progress, 0.5);
});
