import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompletionCandidate,
  createEmptyProgress,
  getEffectiveStreak,
  normalizeProgress,
  STREAK_FREEZE_CAP
} from '../src/achievements/progress.js';
import { streakTier, badgeHtml, flameHtml } from '../src/streak.js';

function play(progress, localDate){
  const built = buildCompletionCandidate(progress, {
    sessionId: 's-' + localDate,
    mode: 'normal',
    seenTypes: [],
    succeededTypes: [],
    successStreak: 0,
    bestSuccessStreak: 0,
    errors: 0,
    floorReached: false,
    abandoned: false
  }, { score: 500, previousBest: 0, recordBroken: false, localDate, dailyDate: localDate, completedAt: localDate + 'T10:00:00.000Z' });
  return { progress: built.candidate, session: built.completedSession };
}

function day(n){ return `2026-10-${String(n).padStart(2, '0')}`; }

function streakOf(days, startFreezes = 0){
  let p = createEmptyProgress('2026-10-01T00:00:00.000Z');
  p.stats.streakFreezes = startFreezes;
  let last;
  for(let i = 1; i <= days; i++){ last = play(p, day(i)); p = last.progress; }
  return { p, last };
}

test('un gel est gagné au 7e jour de série, pas avant', () => {
  assert.equal(streakOf(6).p.stats.streakFreezes, 0);
  const seven = streakOf(7);
  assert.equal(seven.p.stats.streakFreezes, 1);
  assert.equal(seven.last.session.freezeEarned, true);
  assert.equal(streakOf(6).p.stats.currentStreak, 6);
});

test('le stock de gels est plafonné à 2', () => {
  assert.equal(streakOf(14).p.stats.streakFreezes, 2);
  const twentyOne = streakOf(21);
  assert.equal(twentyOne.p.stats.streakFreezes, STREAK_FREEZE_CAP);
  assert.equal(twentyOne.last.session.freezeEarned, false);
});

test('un jour manqué est sauvé par un gel, qui est consommé', () => {
  const { p } = streakOf(7);
  const saved = play(p, day(9));
  assert.equal(saved.progress.stats.currentStreak, 8);
  assert.equal(saved.progress.stats.streakFreezes, 0);
  assert.equal(saved.session.freezeUsed, 1);
  assert.equal(saved.session.freezeEarned, false);
});

test('sans gel, ou avec un écart trop grand, la série repart à 1 et le stock est conservé', () => {
  const noFreeze = streakOf(5);
  assert.equal(play(noFreeze.p, day(7)).progress.stats.currentStreak, 1);
  const { p } = streakOf(7);
  const tooLong = play(p, day(11));
  assert.equal(tooLong.progress.stats.currentStreak, 1);
  assert.equal(tooLong.progress.stats.streakFreezes, 1);
  assert.equal(tooLong.session.freezeUsed, 0);
});

test('deux gels couvrent deux jours manqués', () => {
  const { p } = streakOf(14);
  const saved = play(p, day(17));
  assert.equal(saved.progress.stats.currentStreak, 15);
  assert.equal(saved.progress.stats.streakFreezes, 0);
  assert.equal(saved.session.freezeUsed, 2);
});

test('une série sauvée par un gel qui atteint un palier de 7 rapporte un nouveau gel', () => {
  const { p } = streakOf(13, 1);
  p.stats.streakFreezes = 1;
  const saved = play(p, day(15));
  assert.equal(saved.progress.stats.currentStreak, 14);
  assert.equal(saved.session.freezeUsed, 1);
  assert.equal(saved.session.freezeEarned, true);
  assert.equal(saved.progress.stats.streakFreezes, 1);
});

test('une 2e partie le même jour ne touche ni la série ni les gels', () => {
  const { p } = streakOf(7);
  const again = play(p, day(7));
  assert.equal(again.progress.stats.currentStreak, 7);
  assert.equal(again.progress.stats.streakFreezes, 1);
  assert.equal(again.session.freezeEarned, false);
});

test('série affichée : un gel en stock la maintient tant qu’il couvre l’écart', () => {
  const { p } = streakOf(7);
  const at = d => getEffectiveStreak(p, new Date(`${d}T12:00:00`));
  assert.equal(at(day(7)).count, 7);
  assert.equal(at(day(8)).count, 7);
  assert.equal(at(day(9)).count, 7);
  assert.equal(at(day(9)).freezes, 1);
  assert.equal(at(day(10)).count, 0);
  const none = streakOf(5).p;
  assert.equal(getEffectiveStreak(none, new Date(`${day(7)}T12:00:00`)).count, 0);
});

test('les gels sont normalisés à la lecture de la sauvegarde', () => {
  const base = createEmptyProgress('2026-10-01T00:00:00.000Z');
  base.stats.streakFreezes = 9;
  assert.equal(normalizeProgress(base).progress.stats.streakFreezes, STREAK_FREEZE_CAP);
  delete base.stats.streakFreezes;
  assert.equal(normalizeProgress(base).progress.stats.streakFreezes, 0);
});

test('paliers de flamme : 2, 7, 14, 30, 60, 100 jours', () => {
  const tiers = [0, 1, 2, 6, 7, 13, 14, 29, 30, 59, 60, 99, 100, 400].map(streakTier);
  assert.deepEqual(tiers, [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  assert.match(flameHtml(30), /streak-flame t4/);
  assert.equal(streakTier('abc'), 0);
});

test('badge du classement : visible dès 7 jours, avec la flamme du palier', () => {
  assert.equal(badgeHtml(0), '');
  assert.equal(badgeHtml(6), '');
  assert.equal(badgeHtml(undefined), '');
  assert.match(badgeHtml(7), /t2/);
  assert.match(badgeHtml(120), /<span>120<\/span>/);
});
