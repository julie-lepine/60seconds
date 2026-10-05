import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ACHIEVEMENTS } from '../src/achievements/catalog.js';
import {
  ACHIEVEMENT_TRANSLATION_KEYS,
  SUPPORTED_LANGUAGES,
  hasTranslation,
  translateForLanguage
} from '../src/i18n.js';

const UI_KEYS = [
  'achievements',
  'achievementLocked',
  'achievementUnlockedOn',
  'achievementUnlocked',
  'achievementsUnlocked',
  'otherAchievements',
  'achievementCategoryConsistency',
  'achievementCategoryScores',
  'achievementCategoryMastery',
  'achievementCategoryExperience'
];

test('all 30 achievement titles and descriptions exist in all four languages', () => {
  assert.deepEqual([...SUPPORTED_LANGUAGES], ['fr', 'en', 'es', 'de']);
  assert.equal(ACHIEVEMENT_TRANSLATION_KEYS.length, 60);

  for(const language of SUPPORTED_LANGUAGES){
    for(const key of ACHIEVEMENT_TRANSLATION_KEYS){
      assert.equal(hasTranslation(language, key), true, `${language}: ${key}`);
      const value = translateForLanguage(language, key);
      assert.ok(value.trim(), `${language}: empty ${key}`);
      assert.notEqual(value, key, `${language}: unresolved ${key}`);
    }
  }
});

test('achievement UI and category keys exist in all four languages', () => {
  for(const language of SUPPORTED_LANGUAGES){
    for(const key of UI_KEYS){
      assert.equal(hasTranslation(language, key), true, `${language}: ${key}`);
      assert.notEqual(translateForLanguage(language, key, {
        date: '5 Oct 2026',
        count: 2
      }), key);
    }
  }
});

test('French achievement copy remains aligned with the business catalog', () => {
  for(const item of ACHIEVEMENTS){
    assert.equal(translateForLanguage('fr', `achievement.${item.id}.title`), item.title);
    assert.equal(translateForLanguage('fr', `achievement.${item.id}.description`), item.description);
  }
});

test('new achievement UI modules contain no hard-coded French product labels', () => {
  const files = [
    '../src/screens/achievements.js',
    '../src/achievements/presentation.js'
  ];
  const forbidden = /SUCCÈS|VERROUILLÉ|DÉBLOQUÉ|ASSIDUITÉ|MAÎTRISE DU JEU/;

  for(const relative of files){
    const source = readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
    assert.equal(forbidden.test(source), false, relative);
  }
});
