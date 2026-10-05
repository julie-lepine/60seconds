import test from 'node:test';
import assert from 'node:assert/strict';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;

function element(){
  return {
    innerHTML: '',
    textContent: '',
    onclick: null,
    classList: { add: () => {}, toggle: () => {} },
    addEventListener: () => {}
  };
}

const view = element();
const elements = new Map([['view', view]]);

globalThis.document = {
  documentElement: { classList: { toggle: () => {} } },
  getElementById: id => {
    if(!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  },
  querySelector: () => null
};
globalThis.window = {
  matchMedia: () => ({ matches: false })
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

const [
  { renderHome },
  { G }
] = await Promise.all([
  import('../src/screens/home.js'),
  import('../src/state.js')
]);

test.after(() => {
  if(originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if(originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if(originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
});

test('Home opens the complete achievement screen and its back action returns Home', () => {
  renderHome();
  assert.equal(G.screen, 'home');
  assert.match(view.innerHTML, /id="nav-achievements"/);

  elements.get('nav-achievements').onclick();
  assert.equal(G.screen, 'achievements');
  assert.match(view.innerHTML, /id="screen-achievements"/);
  assert.equal((view.innerHTML.match(/data-achievement-id=/g) || []).length, 30);
  assert.equal((view.innerHTML.match(/data-achievement-category=/g) || []).length, 4);

  elements.get('backAchievements').onclick();
  assert.equal(G.screen, 'home');
  assert.match(view.innerHTML, /id="screen-home"/);
});
