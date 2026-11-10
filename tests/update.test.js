import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };

const u = await import('../src/update.js');
const { STORE_URLS } = await import('../src/constants.js');
const { SUPPORTED_LANGUAGES, translateForLanguage } = await import('../src/i18n.js');

const DAY = 24 * 60 * 60 * 1000;

test('comparaison de versions', () => {
  assert.equal(u.compareVersions('1.0.6', '1.0.7'), -1);
  assert.equal(u.compareVersions('1.0.7', '1.0.7'), 0);
  assert.equal(u.compareVersions('1.1.0', '1.0.9'), 1);
  assert.equal(u.compareVersions('1.0.10', '1.0.9'), 1);
  assert.equal(u.compareVersions('1.0', '1.0.0'), 0);
  assert.equal(u.compareVersions('2', '1.9.9'), 1);
  assert.equal(u.compareVersions('abc', '0.0.1'), -1);
  assert.equal(u.compareVersions(undefined, '1.0.0'), -1);
});

test('la version 1.1 est bien plus récente que la 1.0.9', () => {
  assert.equal(u.compareVersions('1.0.9', '1.1'), -1);
  assert.equal(u.compareVersions('1.1', '1.1.0'), 0);
  assert.equal(u.decideUpdate({ current: '1.0.9', latest: '1.1', min: null, dismissed: null }), 'optional');
  assert.equal(u.decideUpdate({ current: '1.1', latest: '1.1', min: null, dismissed: null }), 'none');
});

test('décision : rien si à jour, proposition si en retard, blocage sous la version minimale', () => {
  const base = { current: '1.0.6', latest: '1.0.6', min: null, dismissed: null };
  assert.equal(u.decideUpdate(base), 'none');
  assert.equal(u.decideUpdate({ ...base, current: '1.0.8' }), 'none');
  assert.equal(u.decideUpdate({ ...base, latest: '1.0.7' }), 'optional');
  assert.equal(u.decideUpdate({ ...base, latest: '1.0.7', min: '1.0.6' }), 'optional');
  assert.equal(u.decideUpdate({ ...base, latest: '1.0.7', min: '1.0.7' }), 'required');
  assert.equal(u.decideUpdate({ ...base, latest: null }), 'none');
});

test('« plus tard » : silence 3 jours pour cette version, puis rappel ; une version plus récente repropose tout de suite', () => {
  const now = 1_000_000_000_000;
  const base = { current: '1.0.6', latest: '1.0.7', min: null, now };
  assert.equal(u.decideUpdate({ ...base, dismissed: { version: '1.0.7', at: now - DAY } }), 'none');
  assert.equal(u.decideUpdate({ ...base, dismissed: { version: '1.0.7', at: now - 4 * DAY } }), 'optional');
  assert.equal(u.decideUpdate({ ...base, dismissed: { version: '1.0.6', at: now - 1000 } }), 'optional');
  // une mise à jour obligatoire ne se repousse pas
  assert.equal(u.decideUpdate({ ...base, min: '1.0.7', dismissed: { version: '1.0.7', at: now } }), 'required');
});

test('le choix « plus tard » est mémorisé et relu', () => {
  store.clear();
  assert.equal(u.readDismissed(), null);
  u.saveDismissed('1.0.7', 123);
  assert.deepEqual(u.readDismissed(), { version: '1.0.7', at: 123 });
  store.set('60seconds_update_dismissed', '{pas du json');
  assert.equal(u.readDismissed(), null);
});

test('vérification : bon lien de store, rien sur le web, rien en cas d’erreur', async () => {
  store.clear();
  const row = async () => ({ latest_version: '1.0.7', min_version: null });
  const android = await u.checkForUpdate({ platform: 'android', current: '1.0.6', fetchRow: row });
  assert.deepEqual(android, { status: 'optional', latest: '1.0.7', url: STORE_URLS.android });
  const ios = await u.checkForUpdate({ platform: 'ios', current: '1.0.6', fetchRow: row });
  assert.equal(ios.url, STORE_URLS.ios);
  assert.equal((await u.checkForUpdate({ platform: 'ios', current: '1.0.7', fetchRow: row })).status, 'none');
  assert.equal((await u.checkForUpdate({ platform: null, current: '1.0.6', fetchRow: row })).status, 'none');
  assert.equal((await u.checkForUpdate({ platform: 'ios', current: '1.0.6', fetchRow: async () => null })).status, 'none');
  assert.equal((await u.checkForUpdate({ platform: 'ios', current: '1.0.6', fetchRow: async () => { throw new Error('réseau'); } })).status, 'none');
  // navigateur : pas de plateforme native
  assert.equal((await u.checkForUpdate({ current: '1.0.6', fetchRow: row })).status, 'none');
});

test('les liens de store sont ceux de l’app', () => {
  assert.equal(STORE_URLS.ios, 'https://apps.apple.com/fr/app/60-secondes/id6812448901');
  assert.equal(STORE_URLS.android, 'https://play.google.com/store/apps/details?id=com.hfc.sixtyseconds');
});

function fakeDoc(){
  const nodes = [];
  const doc = {
    nodes,
    createElement: () => {
      const el = { attrs: {}, listeners: {}, innerHTML: '', removed: false,
        setAttribute(k, v){ this.attrs[k] = v; }, remove(){ this.removed = true; const i = nodes.indexOf(this); if(i >= 0) nodes.splice(i, 1); },
        addEventListener(){} };
      return el;
    },
    body: { appendChild: el => nodes.push(el) },
    getElementById: id => {
      const modal = nodes[0];
      if(id === 'updateModal') return modal || null;
      if(id === 'updateLater' && modal && /updateLater/.test(modal.innerHTML)) return { addEventListener: (ev, fn) => { modal.onLater = fn; } };
      return null;
    }
  };
  return doc;
}

test('la modale propose le bon lien, avec « plus tard » seulement si facultative', () => {
  store.clear();
  const doc = fakeDoc();
  const modal = u.showUpdateModal({ status: 'optional', latest: '1.0.7', url: STORE_URLS.android }, doc);
  assert.match(modal.innerHTML, /href="https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.hfc\.sixtyseconds"/);
  assert.match(modal.innerHTML, /updateLater/);
  modal.onLater();
  assert.equal(modal.removed, true);
  assert.equal(u.readDismissed().version, '1.0.7');

  const hard = u.showUpdateModal({ status: 'required', latest: '1.0.7', url: STORE_URLS.ios }, fakeDoc());
  assert.doesNotMatch(hard.innerHTML, /updateLater/);
  assert.match(hard.innerHTML, /apps\.apple\.com/);
  assert.equal(u.showUpdateModal({ status: 'none' }, fakeDoc()), null);
});

test('les textes de la modale existent dans les quatre langues', () => {
  for(const language of SUPPORTED_LANGUAGES){
    for(const key of ['updateTitle', 'updateBody', 'updateBodyRequired', 'updateGo', 'updateLater']){
      assert.notEqual(translateForLanguage(language, key), key, `${language}/${key}`);
    }
  }
});
