import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChallengeText, shareChallenge } from '../src/share.js';
import { SHARE_URL } from '../src/constants.js';

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
function setNavigator(value){
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}
test.after(() => {
  if(originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
});

test('le message contient le score (espace classique) et le lien, pour chaque mode', () => {
  for(const mode of ['normal', 'daily', 'hardcore']){
    const text = buildChallengeText(mode, 4320);
    assert.match(text, /4 320/, mode);
    assert.ok(text.includes(SHARE_URL), mode);
    assert.doesNotMatch(text, / /, 'pas d’espace insécable fine dans le message');
    assert.doesNotMatch(text, /\{(score|url)\}/, 'aucune variable non remplacée');
  }
  assert.notEqual(buildChallengeText('daily', 100), buildChallengeText('normal', 100));
  assert.notEqual(buildChallengeText('hardcore', 100), buildChallengeText('normal', 100));
});

test('partage natif quand disponible', async () => {
  const calls = [];
  const Share = {
    canShare: async () => ({ value: true }),
    share: async options => { calls.push(options); }
  };
  assert.equal(await shareChallenge('daily', 2500, { Share }), 'shared');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].text.includes(SHARE_URL));
  assert.match(calls[0].text, /2 500/);
});

test('annulation par le joueur : pas de copie de secours', async () => {
  let copied = false;
  setNavigator({ clipboard: { writeText: async () => { copied = true; } } });
  const Share = {
    canShare: async () => ({ value: true }),
    share: async () => { throw new Error('Share canceled'); }
  };
  assert.equal(await shareChallenge('normal', 900, { Share }), 'cancelled');
  assert.equal(copied, false);
});

test('partage indisponible : le message est copié', async () => {
  let written = '';
  setNavigator({ clipboard: { writeText: async text => { written = text; } } });
  const Share = { canShare: async () => ({ value: false }), share: async () => { throw new Error('inutile'); } };
  assert.equal(await shareChallenge('hardcore', 1200, { Share }), 'copied');
  assert.match(written, /1 200/);
  assert.ok(written.includes(SHARE_URL));
});

test('ni partage ni presse-papiers : échec propre', async () => {
  setNavigator({});
  const Share = { canShare: async () => { throw new Error('indisponible'); } };
  assert.equal(await shareChallenge('normal', 10, { Share }), 'failed');
});
