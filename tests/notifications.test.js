import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };

const n = await import('../src/notifications.js');
const { SUPPORTED_LANGUAGES, translateForLanguage } = await import('../src/i18n.js');

const echo = (key, vars) => (vars ? `${key}:${vars.count}` : key);
const NOW = new Date(2026, 10, 10, 10, 0, 0);

function fakePlugin({ permission = 'granted', requestResult = 'granted', pending = [] } = {}){
  const calls = { cancel: [], schedule: [], requested: 0 };
  let current = permission;
  return {
    calls,
    getPending: async () => ({ notifications: pending }),
    cancel: async arg => { calls.cancel.push(arg); },
    checkPermissions: async () => ({ display: current }),
    requestPermissions: async () => { calls.requested += 1; current = requestResult; return { display: current }; },
    schedule: async arg => { calls.schedule.push(arg); }
  };
}

test('plan : 7 rappels du matin à l’heure choisie + rappel du soir si la série est en jeu', () => {
  const plan = n.planNotifications({ now: NOW, time: '12:00', streak: 5, translate: echo });
  const morning = plan.filter(p => p.id < 2000);
  assert.equal(morning.length, 7);
  assert.equal(morning[0].body, 'notifDailyStreak:5');
  assert.equal(morning[1].body, 'notifDaily');
  assert.equal(morning[0].at.getHours(), 12);
  assert.equal(morning[1].at.getDate(), 11);
  const evening = plan.find(p => p.id === 2000);
  assert.equal(evening.body, 'notifStreakRisk:5');
  assert.equal(evening.at.getHours(), 20);
  assert.equal(evening.at.getMinutes(), 30);
  assert.equal(new Set(plan.map(p => p.id)).size, plan.length);
});

test('plan : défi déjà fait → pas de rappel aujourd’hui', () => {
  const plan = n.planNotifications({ now: NOW, time: '12:00', dailyDone: true, streak: 5, completedToday: true, translate: echo });
  assert.equal(plan.filter(p => p.id < 2000).length, 6);
  assert.ok(plan.every(p => p.at.getDate() !== 10));
  assert.equal(plan.find(p => p.id === 2000), undefined);
});

test('plan : heure déjà passée → on commence demain', () => {
  const plan = n.planNotifications({ now: new Date(2026, 10, 10, 13, 0), time: '12:00', streak: 3, translate: echo });
  assert.equal(plan.filter(p => p.id < 2000).length, 6);
  assert.equal(plan[0].at.getDate(), 11);
});

test('plan : pas de rappel du soir sans série, série déjà sauvée, soir passé ou rappel tardif', () => {
  const base = { now: NOW, time: '12:00', translate: echo };
  assert.equal(n.planNotifications({ ...base, streak: 0 }).some(p => p.id === 2000), false);
  assert.equal(n.planNotifications({ ...base, streak: 4, completedToday: true }).some(p => p.id === 2000), false);
  assert.equal(n.planNotifications({ ...base, time: '19:30', streak: 4 }).some(p => p.id === 2000), false);
  assert.equal(n.planNotifications({ ...base, now: new Date(2026, 10, 10, 21, 0), streak: 4 }).some(p => p.id === 2000), false);
  assert.equal(n.planNotifications({ ...base, streak: 0 })[0].body, 'notifDaily');
});

test('l’heure invalide retombe sur 12:00', () => {
  assert.deepEqual(n.parseTime('25:99'), { hour: 12, minute: 0 });
  assert.deepEqual(n.parseTime(''), { hour: 12, minute: 0 });
  assert.deepEqual(n.parseTime('7:05'), { hour: 7, minute: 5 });
  assert.equal(n.formatTime({ hour: 7, minute: 5 }), '07:05');
});

test('sync : annule tout, puis reprogramme les rappels quand c’est activé et autorisé', async () => {
  store.clear();
  n.saveNotificationPrefs({ enabled: true, time: '09:00' });
  const LN = fakePlugin({ pending: [{ id: 1000 }, { id: 2000 }] });
  const result = await n.syncNotifications({ native: true, LocalNotifications: LN, now: NOW });
  assert.equal(result, 'scheduled');
  assert.deepEqual(LN.calls.cancel[0].notifications, [{ id: 1000 }, { id: 2000 }]);
  const scheduled = LN.calls.schedule[0].notifications;
  assert.ok(scheduled.length >= 6);
  assert.ok(scheduled.every(x => x.schedule.at instanceof Date && x.schedule.allowWhileIdle === true));
  assert.ok(scheduled.every(x => x.title && x.body));
});

test('sync : désactivé → annule seulement ; refusé → ne programme rien ; web → ignoré', async () => {
  store.clear();
  const off = fakePlugin({ pending: [{ id: 1000 }] });
  assert.equal(await n.syncNotifications({ native: true, LocalNotifications: off, now: NOW }), 'disabled');
  assert.equal(off.calls.cancel.length, 1);
  assert.equal(off.calls.schedule.length, 0);

  n.saveNotificationPrefs({ enabled: true });
  const denied = fakePlugin({ permission: 'denied' });
  assert.equal(await n.syncNotifications({ native: true, LocalNotifications: denied, now: NOW }), 'denied');
  assert.equal(denied.calls.schedule.length, 0);

  const web = fakePlugin();
  assert.equal(await n.syncNotifications({ native: false, LocalNotifications: web }), 'unsupported');
  assert.equal(web.calls.cancel.length + web.calls.schedule.length, 0);
});

test('sync : une erreur du plugin ne remonte jamais', async () => {
  store.clear();
  n.saveNotificationPrefs({ enabled: true });
  const broken = { getPending: async () => { throw new Error('boom'); } };
  assert.equal(await n.syncNotifications({ native: true, LocalNotifications: broken }), 'error');
});

test('activation : demande la permission, mémorise le choix et programme', async () => {
  store.clear();
  const ok = fakePlugin({ permission: 'prompt', requestResult: 'granted' });
  assert.equal(await n.enableNotifications({ native: true, LocalNotifications: ok, now: NOW }), 'granted');
  assert.equal(ok.calls.requested, 1);
  assert.deepEqual(n.getNotificationPrefs(), { enabled: true, time: '12:00', asked: true });
  assert.ok(ok.calls.schedule.length === 1);

  store.clear();
  const no = fakePlugin({ permission: 'prompt', requestResult: 'denied' });
  assert.equal(await n.enableNotifications({ native: true, LocalNotifications: no, now: NOW }), 'denied');
  assert.deepEqual(n.getNotificationPrefs(), { enabled: false, time: '12:00', asked: true });
  assert.equal(no.calls.schedule.length, 0);
});

test('désactivation : annule les rappels et mémorise le choix', async () => {
  store.clear();
  n.saveNotificationPrefs({ enabled: true });
  const LN = fakePlugin({ pending: [{ id: 1001 }] });
  assert.equal(await n.disableNotifications({ native: true, LocalNotifications: LN }), 'disabled');
  assert.equal(n.getNotificationPrefs().enabled, false);
  assert.equal(LN.calls.cancel.length, 1);
});

test('la proposition n’est faite que sur mobile, après un défi du jour', () => {
  store.clear();
  assert.equal(n.shouldOfferNotifications('daily'), false); // navigateur : non supporté
  assert.equal(n.shouldOfferNotifications('normal'), false);
});

test('les textes de notification existent dans les quatre langues', () => {
  for(const language of SUPPORTED_LANGUAGES){
    for(const key of ['notifTitle', 'notifDaily', 'notifDailyStreak', 'notifStreakRisk', 'notifSetting', 'notifTimeLabel', 'notifBlocked', 'notifAsk', 'notifYes', 'notifLater', 'notifEnabledMsg']){
      assert.notEqual(translateForLanguage(language, key), key, `${language}/${key}`);
    }
    assert.match(translateForLanguage(language, 'notifStreakRisk', { count: 12 }), /12/);
    assert.match(translateForLanguage(language, 'notifDailyStreak', { count: 12 }), /12/);
  }
});
