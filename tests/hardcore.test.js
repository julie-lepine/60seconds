import test from 'node:test';
import assert from 'node:assert/strict';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

class FakeAudioContext {
  constructor(){ this.state = 'running'; this.currentTime = 0; this.destination = {}; }
  createOscillator(){
    return { type: 'sine', frequency: { value: 0, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} };
  }
  createGain(){
    return { gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} };
  }
  resume(){}
}

function element(){
  return {
    innerHTML: '', textContent: '', style: {}, onclick: null,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    querySelector: () => element()
  };
}

const store = new Map();
globalThis.localStorage = {
  getItem: key => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => { store.set(key, String(value)); },
  removeItem: key => { store.delete(key); }
};
const root = { classList: { toggled: [], add: () => {}, remove: () => {}, toggle(name, on){ this.toggled.push([name, on]); } } };
const elements = {
  view: element(), 'screen-end': element(), challengeArea: null, hcScore: element(),
  scoreNum: element(), deltaLine: element(), streakLine: element(), againBtn: element(), homeLink: element()
};
globalThis.document = {
  body: { contains: () => true },
  documentElement: root,
  getElementById: id => elements[id] || null,
  querySelector: () => null
};
globalThis.window = { AudioContext: FakeAudioContext };
globalThis.cancelAnimationFrame = () => {};
globalThis.requestAnimationFrame = callback => { callback(); return 1; };
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';

const [
  engine, session, endScreen, progress, storage, leaderboard, utils, { G }, { HARDCORE_PENALTY_STEP }, { translateForLanguage, SUPPORTED_LANGUAGES }
] = await Promise.all([
  import('../src/game/engine.js'),
  import('../src/achievements/session.js'),
  import('../src/screens/end.js'),
  import('../src/achievements/progress.js'),
  import('../src/storage.js'),
  import('../src/leaderboard/leaderboard.js'),
  import('../src/utils.js'),
  import('../src/state.js'),
  import('../src/constants.js'),
  import('../src/i18n.js')
]);

function makeArea(){
  let html = '';
  return { style: {}, get innerHTML(){ return html; }, set innerHTML(v){ html = v; } };
}

function resolveResult(kind, points, mode, startScore){
  session.resetGameSessionForTests();
  session.createGameSession(mode);
  const context = session.markChallengeShown('math');
  elements.challengeArea = makeArea();
  elements.hcScore.textContent = '';
  G.mode = mode;
  G.screen = 'gameplay';
  G.score = startScore;
  G.sound = false;
  G.flashLock = false;
  G.endTime = performance.now() + 60000;
  globalThis.setTimeout = () => 1;
  globalThis.clearTimeout = () => {};
  try{ engine.resultFlash(kind, points, context); }
  finally{
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
  return { score: G.score, html: elements.challengeArea.innerHTML, hcScore: elements.hcScore.textContent };
}

test.after(() => {
  session.resetGameSessionForTests();
  endScreen.resetEndGameForTests();
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  if(originalFetch) globalThis.fetch = originalFetch; else delete globalThis.fetch;
  if(originalCancelAnimationFrame) globalThis.cancelAnimationFrame = originalCancelAnimationFrame; else delete globalThis.cancelAnimationFrame;
  if(originalRequestAnimationFrame) globalThis.requestAnimationFrame = originalRequestAnimationFrame; else delete globalThis.requestAnimationFrame;
  if(originalLocalStorage) globalThis.localStorage = originalLocalStorage; else delete globalThis.localStorage;
  if(originalWindow) globalThis.window = originalWindow; else delete globalThis.window;
  if(originalDocument) globalThis.document = originalDocument; else delete globalThis.document;
});

test('la pénalité hardcore commence à 50 et monte de 50 en 50', () => {
  assert.equal(HARDCORE_PENALTY_STEP, 50);
  assert.deepEqual([0, 1, 2, 3].map(n => engine.hardcorePenalty(n)), [50, 100, 150, 200]);
});

test('erreurs consécutives : la pénalité grimpe, une réussite la remet à 50', () => {
  const run = (kind, pts, start, streak) => { G.hcErrorStreak = streak; return resolveResult(kind, pts, 'hardcore', start); };
  assert.equal(run('bad', 0, 1000, 0).score, 950);
  assert.equal(G.hcErrorStreak, 1);
  assert.equal(run('bad', 0, 950, 1).score, 850);
  assert.equal(run('bad', 0, 850, 2).score, 700);
  assert.equal(G.hcErrorStreak, 3);
  assert.equal(run('good', 150, 700, 3).score, 850);
  assert.equal(G.hcErrorStreak, 0);
  assert.equal(run('bad', 0, 850, G.hcErrorStreak).score, 800);
});

test('applyResultScore : une erreur retire la pénalité en hardcore, sans descendre sous 0', () => {
  assert.equal(engine.applyResultScore(500, 'bad', 0, 'hardcore'), 450);
  assert.equal(engine.applyResultScore(500, 'bad', 0, 'hardcore', 2), 350);
  assert.equal(engine.applyResultScore(30, 'bad', 0, 'hardcore'), 0);
  assert.equal(engine.applyResultScore(0, 'bad', 0, 'hardcore'), 0);
  assert.equal(engine.applyResultScore(500, 'good', 150, 'hardcore'), 650);
  assert.equal(engine.applyResultScore(500, 'insane', 260, 'hardcore'), 760);
});

test('applyResultScore : aucune pénalité en normal et en quotidien', () => {
  assert.equal(engine.applyResultScore(500, 'bad', 0, 'normal'), 500);
  assert.equal(engine.applyResultScore(500, 'bad', 0, 'daily'), 500);
  assert.equal(engine.applyResultScore(500, 'good', 150, 'normal'), 650);
});

test('une erreur hardcore affiche la pénalité réellement retirée et met à jour le score en jeu', () => {
  G.hcErrorStreak = 2;
  const result = resolveResult('bad', 0, 'hardcore', 500);
  assert.equal(result.score, 350);
  assert.match(result.html, /feedback display bad/);
  assert.match(result.html, /feedback-penalty[^>]*>−150</);
  assert.equal(result.hcScore, '350');
});

test('une erreur hardcore avec peu de points ne retire que ce qu’il reste', () => {
  G.hcErrorStreak = 0;
  const result = resolveResult('bad', 0, 'hardcore', 30);
  assert.equal(result.score, 0);
  assert.match(result.html, /−30</);
  const empty = resolveResult('bad', 0, 'hardcore', 0);
  assert.equal(empty.score, 0);
  assert.doesNotMatch(empty.html, /feedback-penalty/);
});

test('une erreur en mode normal ne change ni le score ni l’affichage', () => {
  const result = resolveResult('bad', 0, 'normal', 500);
  assert.equal(result.score, 500);
  assert.doesNotMatch(result.html, /feedback-penalty/);
});

test('une réussite hardcore ajoute les mêmes points qu’en normal', () => {
  assert.equal(resolveResult('good', 150, 'hardcore', 0).score, 150);
  assert.equal(resolveResult('insane', 260, 'hardcore', 150).score, 410);
});

test('la session hardcore garde son mode', () => {
  session.resetGameSessionForTests();
  assert.equal(session.createGameSession('hardcore').mode, 'hardcore');
  assert.equal(session.createGameSession('daily').mode, 'daily');
  assert.equal(session.createGameSession('autre').mode, 'normal');
});

test('le record hardcore est séparé du record normal / quotidien', () => {
  store.clear();
  assert.equal(storage.saveBestScore('hardcore', 900), storage.STORAGE_WRITE_STATUS.saved);
  assert.equal(storage.getBestScore('hardcore'), 900);
  assert.equal(storage.getBestScore('normal'), 0);
  assert.equal(storage.getBestScore('daily'), 0);
  assert.equal(storage.getRecordScore(), 0);
  storage.saveBestScore('normal', 300);
  assert.equal(storage.getRecordScore(), 300);
  assert.equal(storage.getBestScore('hardcore'), 900);
});

test('le classement distingue hardcore, normal et quotidien', async () => {
  store.clear();
  storage.saveUsername('Julie');
  const hard = leaderboard.buildLeaderboardRow('hardcore', 700);
  assert.deepEqual(hard, { username: 'Julie', score: 700, mode: 'hardcore', daily_date: null });
  assert.equal(leaderboard.buildLeaderboardRow('normal', 700).mode, 'normal');
  const daily = leaderboard.buildLeaderboardRow('daily', 700);
  assert.equal(daily.mode, 'daily');
  assert.ok(daily.daily_date);

  const bodies = [];
  globalThis.fetch = async (url, options) => {
    bodies.push({ url: String(url), body: JSON.parse(options.body) });
    return { ok: true, status: 200, headers: { get: () => null }, text: async () => '[]' };
  };
  await leaderboard.getLeaderboard('hardcore');
  await leaderboard.getLeaderboard('normal');
  await leaderboard.getLeaderboard('daily', '2026-11-03');
  assert.deepEqual(bodies.map(b => b.body.p_mode), ['hardcore', 'normal', 'daily']);
  assert.ok(bodies.every(b => b.url.endsWith('rpc/leaderboard_top')));
});

test('le thème hardcore s’active et se désactive', () => {
  root.classList.toggled.length = 0;
  utils.setHardcoreTheme(true);
  utils.setHardcoreTheme(false);
  assert.deepEqual(root.classList.toggled, [['hardcore', true], ['hardcore', false]]);
});

test('le libellé HARDCORE existe dans les quatre langues', () => {
  for(const language of SUPPORTED_LANGUAGES){
    assert.equal(translateForLanguage(language, 'hardcore'), 'HARDCORE', language);
  }
});

test('fin de partie hardcore : record et classement propres, la partie compte pour les succès et la série, pas pour le quotidien', async () => {
  store.clear();
  const persisted = [];
  const calls = { persist: 0, daily: 0, saved: [], leaderboard: [], bestReads: [] };
  const scheduled = [];
  globalThis.setTimeout = (callback, delay) => { scheduled.push({ callback, delay }); return scheduled.length; };
  globalThis.clearTimeout = () => {};
  const empty = progress.createEmptyProgress('2026-10-01T00:00:00.000Z');
  endScreen.setEndGameDependenciesForTests({
    buildCompletionCandidate: progress.buildCompletionCandidate,
    evaluateAchievements: progress.evaluateAchievements,
    getAchievementProgress: () => empty,
    persistAchievementProgress: async (next) => { calls.persist += 1; persisted.push(next); return true; },
    getBestScore: mode => { calls.bestReads.push(mode); return 400; },
    saveBestScore: (mode, score) => { calls.saved.push([mode, score]); return storage.STORAGE_WRITE_STATUS.saved; },
    saveTodayDailyRun: () => { calls.daily += 1; return storage.STORAGE_WRITE_STATUS.saved; },
    submitLeaderboardScore: async (mode, score) => { calls.leaderboard.push([mode, score]); return null; }
  });
  try{
    session.resetGameSessionForTests();
    session.createGameSession('hardcore');
    G.mode = 'hardcore';
    G.reduceMotion = true;
    G.score = 2100;
    G.best = 400;
    G.screen = 'gameplay';
    await endScreen.endGame();
  }finally{
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
  assert.deepEqual(calls.bestReads, [], 'le hardcore n’est comparé à aucun autre record');
  assert.deepEqual(calls.saved, [['hardcore', 2100]]);
  assert.ok(calls.persist >= 1, 'la progression doit être sauvegardée');
  const final = persisted[persisted.length - 1];
  assert.equal(final.stats.hardcoreGames, 1);
  assert.equal(final.stats.gamesCompleted, 1);
  assert.equal(final.stats.hardcoreRecordsBroken, 1);
  assert.equal(final.stats.recordsBroken, 0);
  assert.equal(final.stats.currentStreak, 1);
  assert.ok(final.unlocked.first_game, 'la partie hardcore compte comme une partie');
  assert.ok(final.unlocked.hardcore_first_game);
  assert.ok(final.unlocked.hardcore_score_2000);
  assert.equal(final.unlocked.hardcore_score_4000, undefined);
  assert.equal(final.unlocked.score_2500, undefined, 'un score hardcore ne débloque pas les succès du jeu normal');
  assert.equal(final.unlocked.score_1000, undefined);
  assert.equal(final.unlocked.new_record, undefined);
  assert.equal(calls.daily, 0);
  assert.deepEqual(calls.leaderboard, [['hardcore', 2100]]);
  assert.equal(session.getActiveGameSession().status, 'completed');

  const render = scheduled.find(item => item.delay === 650);
  assert.ok(render, 'l’écran de fin n’a pas été programmé');
  render.callback();
  const html = elements['screen-end'].innerHTML;
  assert.match(html, /againBtn/);
  assert.match(html, /end-achievements/);
  assert.match(html, /end-streak/);
  endScreen.resetEndGameForTests();
});
