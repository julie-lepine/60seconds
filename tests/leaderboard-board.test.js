import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBoardLayout, topPercent } from '../src/leaderboard/board-layout.js';

const row = (rank, username, score, total = 1240) => ({ rank, username, score, total });

test('topPercent : arrondi au supérieur, jamais 0 %, masqué avec trop peu de joueurs', () => {
  assert.equal(topPercent(149, 1240), 13);
  assert.equal(topPercent(1, 1240), 1);
  assert.equal(topPercent(1240, 1240), 100);
  assert.equal(topPercent(3, 19), null);
  assert.equal(topPercent(0, 100), null);
  assert.equal(topPercent(101, 100), null);
});

test('mise en page : top 10, séparateur, puis voisins du joueur', () => {
  const rows = [];
  for(let i = 1; i <= 10; i++) rows.push(row(i, 'J' + i, 9000 - i));
  rows.push(row(148, 'J148', 3000), row(149, 'Toi', 2990), row(150, 'J150', 2980));
  const { items, me } = buildBoardLayout(rows, 'Toi');
  assert.equal(items.length, 14);
  assert.equal(items[10].type, 'gap');
  assert.equal(items[12].me, true);
  assert.deepEqual(me, { rank: 149, score: 2990, total: 1240, percent: 13 });
});

test('mise en page : pas de séparateur quand le joueur est dans le top ou juste derrière', () => {
  const rows = [row(1, 'A', 5, 3), row(2, 'Toi', 4, 3), row(3, 'C', 3, 3)];
  const { items, me } = buildBoardLayout(rows, 'Toi');
  assert.equal(items.filter(i => i.type === 'gap').length, 0);
  assert.equal(me.rank, 2);
  assert.equal(me.percent, null);
});

test('mise en page : sans pseudo ou joueur absent, pas de résumé', () => {
  const rows = [row(1, 'A', 5)];
  assert.equal(buildBoardLayout(rows, '').me, null);
  assert.equal(buildBoardLayout(rows, 'Zoé').me, null);
  assert.deepEqual(buildBoardLayout([], 'Toi').items, []);
});

test('getBoard appelle la fonction leaderboard_board avec période, pseudo et voisins', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  process.env.VITE_SUPABASE_URL = 'https://x.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'k';
  const storage = await import('../src/storage.js');
  storage.saveUsername('Julie');
  const leaderboard = await import('../src/leaderboard/leaderboard.js');
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify([{ rank: 1, username: 'A', score: 10, total: 2 }, { rank: 2, username: 'Julie', score: 5, total: 2 }]) };
  };
  const res = await leaderboard.getBoard('hardcore', 'month');
  assert.equal(res.error, null);
  assert.equal(res.total, 2);
  assert.equal(res.rows.length, 2);
  assert.ok(calls[0].url.endsWith('rpc/leaderboard_board'));
  assert.deepEqual(calls[0].body, { p_mode: 'hardcore', p_daily_date: null, p_period: 'month', p_username: 'Julie', p_top: 10, p_around: 1 });
  await leaderboard.getBoard('normal', 'nimporte');
  assert.equal(calls[1].body.p_period, 'all');
  globalThis.fetch = async () => ({ ok: false, status: 404, headers: { get: () => null }, text: async () => '{"message":"missing"}' });
  assert.ok((await leaderboard.getBoard('normal', 'all')).error);
});

test('la série est envoyée avec le score, et retirée si la colonne n’existe pas encore', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  process.env.VITE_SUPABASE_URL = 'https://x.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'k';
  const storage = await import('../src/storage.js');
  storage.saveUsername('Julie');
  const leaderboard = await import('../src/leaderboard/leaderboard.js');

  assert.equal(leaderboard.buildLeaderboardRow('normal', 500).streak, undefined);
  assert.equal(leaderboard.buildLeaderboardRow('normal', 500, 0).streak, undefined);
  assert.equal(leaderboard.buildLeaderboardRow('normal', 500, 12).streak, 12);

  const bodies = [];
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    bodies.push(body);
    const rejected = 'streak' in body;
    return { ok: !rejected, status: rejected ? 400 : 201, headers: { get: () => null }, text: async () => (rejected ? '{"message":"column streak does not exist"}' : '') };
  };
  const sent = await leaderboard.submitLeaderboardScore('normal', 500, 12);
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].streak, 12);
  assert.equal('streak' in bodies[1], false);
  assert.equal(sent.score, 500);

  globalThis.fetch = async (url, options) => {
    bodies.push(JSON.parse(options.body));
    return { ok: true, status: 201, headers: { get: () => null }, text: async () => '' };
  };
  bodies.length = 0;
  await leaderboard.submitLeaderboardScore('hardcore', 100, 3);
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].streak, 3);
});

test('le classement renvoie la série des joueurs (0 si absente)', async () => {
  const leaderboard = await import('../src/leaderboard/leaderboard.js');
  globalThis.fetch = async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify([
    { rank: 1, username: 'A', score: 10, total: 2, streak: 14 },
    { rank: 2, username: 'B', score: 5, total: 2, streak: null }
  ]) });
  const res = await leaderboard.getBoard('normal', 'all');
  assert.deepEqual(res.rows.map(r => r.streak), [14, 0]);
  const layout = (await import('../src/leaderboard/board-layout.js')).buildBoardLayout(res.rows, '');
  assert.deepEqual(layout.items.map(i => i.streak), [14, 0]);
});
