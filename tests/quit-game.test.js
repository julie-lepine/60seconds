import test from 'node:test';
import assert from 'node:assert/strict';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

function element(){
  return {
    innerHTML: '', textContent: '', style: {}, onclick: null, dataset: {},
    classList: { add(){}, remove(){}, toggle(){} },
    addEventListener(type, handler){ this.handlers = { ...(this.handlers || {}), [type]: handler }; },
    querySelector: () => element()
  };
}

const store = new Map();
globalThis.localStorage = {
  getItem: key => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => { store.set(key, String(value)); },
  removeItem: key => { store.delete(key); }
};
const elements = {};
for(const id of ['view', 'playBtn', 'dailyBtn', 'hardcoreBtn', 'nav-scores', 'nav-achievements', 'nav-settings', 'quitBtn', 'timerNum', 'challengeArea']){
  elements[id] = element();
}
globalThis.document = {
  body: { contains: () => true },
  documentElement: { classList: { add(){}, remove(){}, toggle(){} } },
  getElementById: id => elements[id] || null,
  querySelector: () => null
};
globalThis.window = {};
globalThis.cancelAnimationFrame = () => {};
globalThis.requestAnimationFrame = () => 1; // pas de boucle de jeu dans ce test
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';

const [{ G }, session, gameplay] = await Promise.all([
  import('../src/state.js'),
  import('../src/achievements/session.js'),
  import('../src/screens/gameplay.js')
]);

test.after(() => {
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  if(originalLocalStorage) globalThis.localStorage = originalLocalStorage; else delete globalThis.localStorage;
  if(originalWindow) globalThis.window = originalWindow; else delete globalThis.window;
  if(originalDocument) globalThis.document = originalDocument; else delete globalThis.document;
});

test('quitGame abandonne la session sans rien enregistrer et revient à l’accueil', () => {
  session.resetGameSessionForTests();
  session.createGameSession('normal');
  G.mode = 'normal';
  G.screen = 'gameplay';
  G.score = 1234;
  assert.equal(gameplay.quitGame(), true);
  assert.equal(session.getActiveGameSession(), null, 'la session est abandonnée');
  assert.equal(G.screen, 'home');
  assert.equal(G.score, 0);
  assert.equal(store.size, 0, 'aucun record, succès ni classement n’est écrit');
});

test('quitGame fonctionne aussi en hardcore et remet le thème normal', () => {
  session.resetGameSessionForTests();
  session.createGameSession('hardcore');
  G.mode = 'hardcore';
  G.screen = 'gameplay';
  assert.equal(gameplay.quitGame(), true);
  assert.equal(G.screen, 'home');
  assert.equal(store.size, 0);
});

test('le défi du jour ne peut pas être quitté', () => {
  session.resetGameSessionForTests();
  session.createGameSession('daily');
  G.mode = 'daily';
  G.screen = 'gameplay';
  assert.equal(gameplay.quitGame(), false);
  assert.equal(G.screen, 'gameplay');
  assert.ok(session.getActiveGameSession());
});

test('hors partie, quitGame ne fait rien', () => {
  G.screen = 'home';
  G.mode = 'normal';
  assert.equal(gameplay.quitGame(), false);
});

test('le bouton demande une confirmation avant d’abandonner', () => {
  session.resetGameSessionForTests();
  G.mode = 'normal';
  G.screen = 'home';
  const timers = [];
  globalThis.setTimeout = (cb, ms) => { timers.push({ cb, ms }); return timers.length; };
  globalThis.clearTimeout = () => {};
  try{
    gameplay.startPlay();
  }catch{ /* le premier défi n'est pas l'objet de ce test */ }
  assert.match(elements.view.innerHTML, /id="quitBtn"/);
  const tap = elements.quitBtn.handlers?.click;
  assert.equal(typeof tap, 'function');
  const button = elements.quitBtn;
  tap({ currentTarget: button });
  assert.equal(G.screen, 'gameplay', 'le premier appui ne quitte pas');
  assert.equal(button.dataset.armed, '1');
  tap({ currentTarget: button });
  assert.equal(G.screen, 'home', 'le second appui quitte');
  assert.equal(session.getActiveGameSession(), null);
});

test('pas de bouton quitter dans le défi du jour', () => {
  session.resetGameSessionForTests();
  G.mode = 'daily';
  G.screen = 'home';
  try{ gameplay.startPlay(); }catch{}
  assert.doesNotMatch(elements.view.innerHTML, /quitBtn/);
});
