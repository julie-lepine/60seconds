import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const elements = {};
const area = { innerHTML: '' };
globalThis.document = {
  getElementById: id => (id === 'tipOk' ? elements.tipOk : null)
};

const { G } = await import('../src/state.js');
const tips = await import('../src/game/tips.js');
const { CHALLENGE_TYPES } = await import('../src/constants.js');
const { SUPPORTED_LANGUAGES, translateForLanguage } = await import('../src/i18n.js');

test('chaque type d’épreuve a une consigne dans les quatre langues', () => {
  assert.deepEqual([...tips.tipTypes()].sort(), [...CHALLENGE_TYPES].sort());
  for(const language of SUPPORTED_LANGUAGES){
    for(const type of CHALLENGE_TYPES){
      const text = translateForLanguage(language, 'tip_' + type);
      assert.ok(text && text !== 'tip_' + type, `${language}/${type}`);
    }
    for(const key of ['tipHeading', 'tipOk', 'tipPaused']){
      assert.notEqual(translateForLanguage(language, key), key, `${language}/${key}`);
    }
  }
});

test('la consigne n’apparaît qu’une fois par type', () => {
  store.clear();
  assert.equal(tips.shouldShowTip('stroop'), true);
  tips.markTipSeen('stroop');
  assert.equal(tips.shouldShowTip('stroop'), false);
  assert.equal(tips.shouldShowTip('math'), true);
  assert.equal(tips.shouldShowTip('inconnu'), false);
});

test('une sauvegarde illisible ne bloque pas le jeu', () => {
  store.set('60seconds_tips_seen', '{pas du json');
  assert.equal(tips.shouldShowTip('tap'), true);
  store.clear();
});

test('la consigne met le chrono en pause puis le rend intact au toucher', async () => {
  store.clear();
  G.screen = 'gameplay';
  elements.tipOk = { onclick: null };
  const now = performance.now();
  G.endTime = now + 40000;
  let started = 0;
  tips.showTip(area, 'reaction', () => { started += 1; });
  assert.ok(G.pauseStart != null);
  assert.match(area.innerHTML, /tip-card/);
  assert.match(area.innerHTML, /tipOk/);
  const endBefore = G.endTime;
  // 5 s plus tard, le joueur touche OK : la fin de partie recule de 5 s.
  const pausedAt = G.pauseStart;
  const realNow = performance.now;
  performance.now = () => pausedAt + 5000;
  try{ elements.tipOk.onclick(); } finally { performance.now = realNow; }
  assert.equal(G.pauseStart, null);
  assert.equal(Math.round(G.endTime - endBefore), 5000);
  assert.equal(started, 1);
  assert.equal(tips.shouldShowTip('reaction'), false);
  // un 2e toucher ne relance pas l'épreuve
  elements.tipOk.onclick();
  assert.equal(started, 1);
});

test('resumeFromTip sans pause ne change rien', () => {
  G.pauseStart = null;
  G.endTime = 12345;
  tips.resumeFromTip(99999);
  assert.equal(G.endTime, 12345);
});
