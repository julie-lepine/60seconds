import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  ACHIEVEMENT_CATEGORIES
} from '../src/achievements/catalog.js';
import {
  CHALLENGE_SCOPES,
  countScopeProgress,
  validateChallengeScopes
} from '../src/achievements/scopes.js';
import { CHALLENGE_TYPES } from '../src/constants.js';

const EXPECTED_SCOPE = [
  'tap',
  'math',
  'timing',
  'oddoneout',
  'reaction',
  'memory',
  'greater',
  'count',
  'evenodd',
  'leftright',
  'goNoGo',
  'sequence',
  'direction',
  'stroop'
];

const EXPECTED_IDS = [
  'streak_2', 'streak_7', 'streak_14', 'streak_30', 'streak_60',
  'streak_100', 'streak_365', 'return_after_7_days', 'complete_weekend',
  'daily_7', 'daily_30', 'first_game', 'score_1000', 'score_2500',
  'score_4000', 'score_6000', 'score_8000', 'score_12000', 'new_record', 'records_5',
  'no_error', 'insane_5', 'all_succeeded_v1', 'timing_exact', 'games_10',
  'games_50', 'games_100', 'games_500', 'seconds_3600', 'seconds_36000',
  'all_seen_v1'
];

const EXPECTED_BY_CATEGORY = {
  consistency: EXPECTED_IDS.slice(0, 11),
  scores: EXPECTED_IDS.slice(11, 20),
  mastery: EXPECTED_IDS.slice(20, 24),
  experience: EXPECTED_IDS.slice(24)
};

test('catalog contains exactly the 31 approved achievements with stable IDs', () => {
  assert.equal(ACHIEVEMENTS.length, 31);
  assert.equal(new Set(ACHIEVEMENTS.map(item => item.id)).size, 31);
  assert.deepEqual(ACHIEVEMENTS.map(item => item.id), EXPECTED_IDS);
  assert.deepEqual(
    ACHIEVEMENTS.map(item => item.title),
    [
      'Départ lancé', 'En rythme', 'Rituel', 'Un mois chrono', '60 à la suite',
      '100 jours', 'À l’année', 'Retour en piste', 'Week-end complet', 'Régulier',
      'Fidèle au poste', 'Première seconde', 'Échauffement', 'Plein régime',
      'Sous tension', 'Surchauffe', 'Ça accélère', 'Hors limites', 'Nouveau record',
      'Record en série', 'Sans erreur', 'Fulgurant', 'Tous terrains',
      'Au centième', 'Habitué', 'Accro', 'Vétéran', 'Inarrêtable',
      'Une heure chrono', 'Marathon', 'Tout vu'
    ]
  );
});

test('catalog keeps the approved category keys and exact membership', () => {
  assert.deepEqual(ACHIEVEMENT_CATEGORIES, {
    consistency: 'Assiduité',
    scores: 'Scores',
    mastery: 'Panache',
    experience: 'Au compteur'
  });
  for(const [category, ids] of Object.entries(EXPECTED_BY_CATEGORY)){
    assert.deepEqual(
      ACHIEVEMENTS.filter(item => item.category === category).map(item => item.id),
      ids
    );
  }
  assert.deepEqual(
    [...new Set(ACHIEVEMENTS.map(item => item.category))].sort(),
    Object.keys(EXPECTED_BY_CATEGORY).sort()
  );
});

test('catalog conditions are known and use the approved thresholds', () => {
  const allowedConditions = new Set([
    'streak', 'returnAfterBreak', 'completeWeekend', 'dailyCount',
    'gamesCount', 'score', 'recordBroken', 'recordsCount', 'noError',
    'insaneCount', 'scopeSucceeded', 'timingExact', 'secondsCount',
    'scopeSeen'
  ]);
  for(const item of ACHIEVEMENTS){
    assert.ok(allowedConditions.has(item.condition), `${item.id}: unknown condition ${item.condition}`);
  }

  const expectedThresholds = {
    streak_2: ['streak', 'days', 2],
    streak_7: ['streak', 'days', 7],
    streak_14: ['streak', 'days', 14],
    streak_30: ['streak', 'days', 30],
    streak_60: ['streak', 'days', 60],
    streak_100: ['streak', 'days', 100],
    streak_365: ['streak', 'days', 365],
    daily_7: ['dailyCount', 'count', 7],
    daily_30: ['dailyCount', 'count', 30],
    first_game: ['gamesCount', 'count', 1],
    score_1000: ['score', 'score', 1000],
    score_2500: ['score', 'score', 2500],
    score_4000: ['score', 'score', 4000],
    score_6000: ['score', 'score', 6000],
    score_8000: ['score', 'score', 8000],
    score_12000: ['score', 'score', 12000],
    new_record: ['recordsCount', 'count', 1],
    records_5: ['recordsCount', 'count', 5],
    games_10: ['gamesCount', 'count', 10],
    games_50: ['gamesCount', 'count', 50],
    games_100: ['gamesCount', 'count', 100],
    games_500: ['gamesCount', 'count', 500],
    seconds_3600: ['secondsCount', 'seconds', 3600],
    seconds_36000: ['secondsCount', 'seconds', 36000]
  };
  for(const [id, [condition, parameter, value]] of Object.entries(expectedThresholds)){
    const item = ACHIEVEMENTS_BY_ID[id];
    assert.equal(item.condition, condition, `${id}: condition`);
    assert.deepEqual(item.params, { [parameter]: value }, `${id}: params`);
  }
});

test('special achievements keep their approved conditions and scope references', () => {
  const expected = {
    return_after_7_days: ['returnAfterBreak', { missedDays: 7 }],
    complete_weekend: ['completeWeekend', {}],
    no_error: ['noError', {}],
    insane_5: ['insaneCount', { count: 5 }],
    all_succeeded_v1: ['scopeSucceeded', { scopeId: 'challenge_scope_v1' }],
    timing_exact: ['timingExact', {}],
    all_seen_v1: ['scopeSeen', { scopeId: 'challenge_scope_v1' }]
  };
  for(const [id, [condition, params]] of Object.entries(expected)){
    const item = ACHIEVEMENTS_BY_ID[id];
    assert.equal(item.condition, condition, `${id}: condition`);
    assert.deepEqual(item.params, params, `${id}: params`);
  }

  const scoped = ACHIEVEMENTS.filter(item => item.params.scopeId);
  assert.deepEqual(scoped.map(item => item.id), ['all_succeeded_v1', 'all_seen_v1']);
  assert.ok(CHALLENGE_SCOPES.challenge_scope_v1);
});

test('catalog descriptions are non-empty and nuanced product wording stays fixed', () => {
  for(const item of ACHIEVEMENTS){
    assert.equal(typeof item.description, 'string');
    assert.ok(item.description.trim().length > 0, `${item.id}: empty description`);
  }
  const nuancedDescriptions = {
    return_after_7_days: 'Rejouer après une interruption d’au moins 7 jours.',
    daily_7: 'Terminer 7 défis quotidiens.',
    daily_30: 'Terminer 30 défis quotidiens.',
    no_error: 'Terminer une partie sans erreur.',
    insane_5: 'Obtenir 5 résultats « Furieux » dans une partie.',
    all_succeeded_v1: 'Réussir chaque type de défi au moins une fois.',
    timing_exact: 'Réussir parfaitement le défi de timing.',
    all_seen_v1: 'Rencontrer tous les types de défis.'
  };
  for(const [id, description] of Object.entries(nuancedDescriptions)){
    assert.equal(ACHIEVEMENTS_BY_ID[id].description, description);
  }
});

test('catalog, entries and parameter objects are immutable', () => {
  assert.ok(Object.isFrozen(ACHIEVEMENT_CATEGORIES));
  assert.ok(Object.isFrozen(ACHIEVEMENTS));
  assert.ok(Object.isFrozen(ACHIEVEMENTS_BY_ID));
  for(const item of ACHIEVEMENTS){
    assert.ok(Object.isFrozen(item), `${item.id}: entry is mutable`);
    assert.ok(Object.isFrozen(item.params), `${item.id}: params are mutable`);
  }
});

test('challenge_scope_v1 is immutable and contains exactly the 14 historical IDs', () => {
  const scope = CHALLENGE_SCOPES.challenge_scope_v1;
  assert.ok(Object.isFrozen(CHALLENGE_SCOPES));
  assert.ok(Object.isFrozen(scope));
  assert.ok(Object.isFrozen(scope.challengeIds));
  assert.deepEqual(scope.challengeIds, EXPECTED_SCOPE);
});

test('scope validation accepts extra future challenges but rejects missing historical ones', () => {
  for(const challengeId of EXPECTED_SCOPE){
    assert.ok(CHALLENGE_TYPES.includes(challengeId), `operational registry is missing ${challengeId}`);
  }
  const registry = Object.fromEntries(EXPECTED_SCOPE.map(id => [id, () => {}]));
  registry.futureChallenge = () => {};
  assert.equal(validateChallengeScopes(registry), true);
  assert.equal(CHALLENGE_SCOPES.challenge_scope_v1.challengeIds.length, 14);

  delete registry.timing;
  assert.throws(
    () => validateChallengeScopes(registry),
    /challenge_scope_v1.*timing/
  );
});

test('a fifteenth challenge does not change historical 13/14 progress', () => {
  const collected = [...EXPECTED_SCOPE.slice(0, 13), 'futureChallenge'];
  assert.deepEqual(
    countScopeProgress(collected, 'challenge_scope_v1'),
    { current: 13, total: 14, complete: false }
  );
});

test('all 14 historical challenges plus future challenges remain 14/14', () => {
  const collected = [...EXPECTED_SCOPE, 'futureChallenge', 'anotherFutureChallenge'];
  assert.deepEqual(
    countScopeProgress(collected, 'challenge_scope_v1'),
    { current: 14, total: 14, complete: true }
  );
});
