import test from 'node:test';
import assert from 'node:assert/strict';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

function classList(){
  return { add: () => {}, toggle: () => {} };
}

function element(){
  return {
    innerHTML: '',
    textContent: '',
    style: {},
    classList: classList(),
    onclick: null,
    addEventListener: () => {},
    querySelector: () => element()
  };
}

const view = element();
const screenEnd = element();
const retryButton = element();
const scoreNum = element();
const deltaLine = element();
const streakLine = element();
const againButton = element();
const homeLink = element();

const elements = {
  view,
  'screen-end': screenEnd,
  retryFinalizeBtn: retryButton,
  scoreNum,
  deltaLine,
  streakLine,
  againBtn: againButton,
  homeLink
};

globalThis.document = {
  body: { contains: () => true },
  documentElement: { classList: classList() },
  getElementById: id => elements[id] || null,
  querySelector: () => null
};
globalThis.window = {};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
globalThis.cancelAnimationFrame = () => {};
globalThis.requestAnimationFrame = callback => {
  callback();
  return 1;
};

let scheduled = [];
globalThis.setTimeout = (callback, delay) => {
  const id = { callback, delay };
  scheduled.push(id);
  return id;
};
globalThis.clearTimeout = () => {};

const [
  endScreen,
  session,
  progress,
  { G },
  { STORAGE_WRITE_STATUS },
  { ACHIEVEMENTS }
] = await Promise.all([
  import('../src/screens/end.js'),
  import('../src/achievements/session.js'),
  import('../src/achievements/progress.js'),
  import('../src/state.js'),
  import('../src/storage.js'),
  import('../src/achievements/catalog.js')
]);

function deferred(){
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function runEndRender(){
  const timer = scheduled.find(item => item.delay === 650);
  assert.ok(timer, 'END final render was not scheduled');
  timer.callback();
}

function makeHarness({
  mode = 'normal',
  score = 1200,
  best = 500,
  persistResults = [true],
  recordResults = [STORAGE_WRITE_STATUS.saved],
  dailyResults = [STORAGE_WRITE_STATUS.saved],
  completionResults = [true],
  leaderboard = () => Promise.resolve(null),
  newlyUnlockedOverride = null,
  previousUnlocked = []
} = {}){
  const previous = progress.createEmptyProgress('2026-10-01T00:00:00.000Z');
  for(const id of previousUnlocked){
    previous.unlocked[id] = '2026-10-01T12:00:00.000Z';
  }
  const calls = {
    build: 0,
    evaluate: 0,
    persist: [],
    record: 0,
    daily: 0,
    complete: 0,
    leaderboard: 0,
    order: [],
    candidate: null,
    completedSession: null
  };
  const realBuild = progress.buildCompletionCandidate;
  const realEvaluate = progress.evaluateAchievements;
  const realComplete = session.completeSessionFinalization;

  G.mode = mode;
  G.score = score;
  G.best = best;
  G.screen = 'gameplay';
  G.sound = false;
  G.reduceMotion = true;
  G.flashLock = false;
  G.raf = null;

  session.createGameSession(mode, 1000);
  const challenge = session.markChallengeShown('math');
  session.recordChallengeResult(challenge, 'good');

  endScreen.setEndGameDependenciesForTests({
    getAchievementProgress: () => previous,
    buildCompletionCandidate: (...args) => {
      calls.build += 1;
      const built = realBuild(...args);
      calls.candidate = built.candidate;
      calls.completedSession = built.completedSession;
      return built;
    },
    evaluateAchievements: (...args) => {
      calls.evaluate += 1;
      const evaluated = realEvaluate(...args);
      return newlyUnlockedOverride == null
        ? evaluated
        : { ...evaluated, newlyUnlocked: newlyUnlockedOverride };
    },
    persistAchievementProgress: value => {
      calls.order.push('progression');
      calls.persist.push(value);
      const next = persistResults.shift();
      return typeof next === 'function' ? next(value) : Promise.resolve(next);
    },
    saveBestScore: () => {
      calls.order.push('record');
      calls.record += 1;
      return recordResults.shift();
    },
    saveTodayDailyRun: () => {
      calls.order.push('daily');
      calls.daily += 1;
      return dailyResults.shift();
    },
    completeSessionFinalization: sessionId => {
      calls.order.push('complete');
      calls.complete += 1;
      const result = completionResults.shift();
      return result === true ? realComplete(sessionId) : false;
    },
    submitLeaderboardScore: (...args) => {
      calls.order.push('leaderboard');
      calls.leaderboard += 1;
      return leaderboard(...args);
    }
  });

  return { calls, previous };
}

test.beforeEach(() => {
  scheduled = [];
  view.innerHTML = '';
  screenEnd.innerHTML = '';
  retryButton.onclick = null;
  session.resetGameSessionForTests();
  endScreen.resetEndGameForTests();
});

test.after(() => {
  session.resetGameSessionForTests();
  endScreen.resetEndGameForTests();
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  if(originalCancelAnimationFrame === undefined) delete globalThis.cancelAnimationFrame;
  else globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  if(originalRequestAnimationFrame === undefined) delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  if(originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if(originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if(originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
});

test('nominal Daily finalization commits local steps before leaderboard and END', async () => {
  const { calls } = makeHarness({ mode: 'daily' });

  const result = await endScreen.endGame();

  assert.equal(calls.build, 1);
  assert.equal(calls.evaluate, 1);
  assert.equal(calls.persist.length, 1);
  assert.equal(calls.record, 1);
  assert.equal(calls.daily, 1);
  assert.equal(calls.complete, 1);
  assert.equal(calls.leaderboard, 1);
  assert.deepEqual(calls.order, ['progression', 'record', 'daily', 'complete', 'leaderboard']);
  assert.equal(session.getActiveGameSession().status, 'completed');
  assert.equal(calls.persist[0].stats.gamesCompleted, 1);
  assert.equal(calls.persist[0].stats.playSeconds, 60);
  assert.ok(result.some(item => item.id === 'first_game'));
  assert.ok(Object.isFrozen(calls.candidate));
  assert.ok(Object.isFrozen(calls.persist[0]));

  runEndRender();
  assert.match(screenEnd.innerHTML, /scoreNum/);
});

test('END renders no achievement block when none was newly unlocked', async () => {
  makeHarness({ newlyUnlockedOverride: [] });
  await endScreen.endGame();

  assert.doesNotMatch(view.innerHTML, /end-achievements/);
  runEndRender();
  assert.doesNotMatch(screenEnd.innerHTML, /end-achievements/);
});

test('END renders one and three newly unlocked achievements without delaying completion', async () => {
  makeHarness({ newlyUnlockedOverride: ACHIEVEMENTS.slice(0, 1) });
  await endScreen.endGame();
  runEndRender();
  assert.equal((screenEnd.innerHTML.match(/end-achievement-title/g) || []).length, 1);
  assert.doesNotMatch(screenEnd.innerHTML, /end-achievements-more/);

  session.resetGameSessionForTests();
  endScreen.resetEndGameForTests();
  scheduled = [];
  screenEnd.innerHTML = '';
  makeHarness({ newlyUnlockedOverride: ACHIEVEMENTS.slice(0, 3) });
  await endScreen.endGame();
  runEndRender();
  assert.equal((screenEnd.innerHTML.match(/end-achievement-title/g) || []).length, 3);
  assert.doesNotMatch(screenEnd.innerHTML, /end-achievements-more/);
});

test('END limits a multi-unlock block to three titles and summarizes the remainder', async () => {
  makeHarness({ newlyUnlockedOverride: ACHIEVEMENTS.slice(0, 5) });
  await endScreen.endGame();
  runEndRender();

  assert.equal((screenEnd.innerHTML.match(/end-achievement-title/g) || []).length, 3);
  assert.match(screenEnd.innerHTML, /end-achievements-more/);
  assert.match(screenEnd.innerHTML, /2/);
});

test('retry shows no achievement before commit and reuses the same frozen unlock list', async () => {
  const unlocks = ACHIEVEMENTS.slice(0, 4);
  makeHarness({
    persistResults: [false, true],
    newlyUnlockedOverride: unlocks
  });

  await endScreen.endGame();
  const pending = endScreen.getPendingFinalizationForTests();
  assert.strictEqual(pending.evaluated.newlyUnlocked, unlocks);
  assert.ok(Object.isFrozen(unlocks));
  assert.doesNotMatch(view.innerHTML, /end-achievements/);

  await endScreen.endGame();
  runEndRender();
  assert.equal((screenEnd.innerHTML.match(/end-achievement-title/g) || []).length, 3);
  assert.match(screenEnd.innerHTML, /end-achievements-more/);
});

test('achievements already unlocked in previous progress are not announced again', async () => {
  makeHarness({
    previousUnlocked: ACHIEVEMENTS.map(item => item.id)
  });
  await endScreen.endGame();
  runEndRender();

  assert.doesNotMatch(screenEnd.innerHTML, /end-achievements/);
});

test('two endGame calls during persistence share one candidate and one commit', async () => {
  const gate = deferred();
  const { calls } = makeHarness({
    persistResults: [() => gate.promise]
  });

  const first = endScreen.endGame();
  const second = endScreen.endGame();

  assert.strictEqual(second, first);
  assert.equal(calls.build, 1);
  assert.equal(calls.persist.length, 1);
  assert.match(view.innerHTML, /SAUVEGARDE/);

  gate.resolve(true);
  await first;

  assert.equal(calls.persist[0].stats.gamesCompleted, 1);
  assert.equal(calls.persist[0].stats.playSeconds, 60);
  assert.equal(calls.complete, 1);
  assert.equal(calls.leaderboard, 1);
});

test('progression failure blocks every following step and retry reuses the frozen candidate', async () => {
  const { calls } = makeHarness({ persistResults: [false, true] });

  await endScreen.endGame();
  const pending = endScreen.getPendingFinalizationForTests();
  const candidate = pending.candidate;
  const evaluated = pending.evaluated.progress;

  assert.equal(session.getActiveGameSession().status, 'finalizing');
  assert.equal(calls.record, 0);
  assert.equal(calls.daily, 0);
  assert.equal(calls.complete, 0);
  assert.equal(calls.leaderboard, 0);
  assert.match(view.innerHTML, /ÉCHEC DE LA SAUVEGARDE/);
  assert.equal(typeof retryButton.onclick, 'function');

  retryButton.onclick();
  await endScreen.getPendingFinalizationForTests().inFlight;

  assert.equal(calls.build, 1);
  assert.strictEqual(calls.candidate, candidate);
  assert.strictEqual(calls.persist[0], evaluated);
  assert.strictEqual(calls.persist[1], evaluated);
  assert.equal(calls.persist[1].stats.gamesCompleted, 1);
  assert.equal(calls.persist[1].stats.playSeconds, 60);
  assert.equal(session.getActiveGameSession().status, 'completed');
});

test('record failure retries from record without rewriting progression or starting Daily', async () => {
  const { calls } = makeHarness({
    persistResults: [true],
    recordResults: [STORAGE_WRITE_STATUS.failed, STORAGE_WRITE_STATUS.saved]
  });

  await endScreen.endGame();
  const candidate = endScreen.getPendingFinalizationForTests().candidate;
  assert.equal(calls.persist.length, 1);
  assert.equal(calls.record, 1);
  assert.equal(calls.daily, 0);
  assert.equal(calls.complete, 0);

  await endScreen.endGame();

  assert.equal(calls.build, 1);
  assert.strictEqual(calls.candidate, candidate);
  assert.equal(calls.persist.length, 1);
  assert.equal(calls.record, 2);
  assert.equal(calls.complete, 1);
  assert.equal(calls.persist[0].stats.recordsBroken, 1);
});

test('Daily failure retries only Daily and does not recount progress or record', async () => {
  const { calls } = makeHarness({
    mode: 'daily',
    persistResults: [true],
    dailyResults: [STORAGE_WRITE_STATUS.failed, STORAGE_WRITE_STATUS.saved]
  });

  await endScreen.endGame();
  const candidate = endScreen.getPendingFinalizationForTests().candidate;
  assert.equal(calls.persist.length, 1);
  assert.equal(calls.record, 1);
  assert.equal(calls.daily, 1);
  assert.equal(calls.complete, 0);

  await endScreen.endGame();

  assert.equal(calls.build, 1);
  assert.strictEqual(calls.candidate, candidate);
  assert.equal(calls.persist.length, 1);
  assert.equal(calls.record, 1);
  assert.equal(calls.daily, 2);
  assert.equal(calls.complete, 1);
  assert.equal(calls.persist[0].stats.gamesCompleted, 1);
  assert.equal(calls.persist[0].stats.playSeconds, 60);
  assert.equal(calls.persist[0].stats.dailyCompleted, 1);
});

test('session completion failure retries only completion', async () => {
  const { calls } = makeHarness({
    mode: 'daily',
    completionResults: [false, true]
  });

  await endScreen.endGame();
  const candidate = endScreen.getPendingFinalizationForTests().candidate;
  assert.equal(calls.persist.length, 1);
  assert.equal(calls.record, 1);
  assert.equal(calls.daily, 1);
  assert.equal(calls.complete, 1);
  assert.equal(calls.leaderboard, 0);

  await endScreen.endGame();

  assert.equal(calls.build, 1);
  assert.strictEqual(calls.candidate, candidate);
  assert.equal(calls.persist.length, 1);
  assert.equal(calls.record, 1);
  assert.equal(calls.daily, 1);
  assert.equal(calls.complete, 2);
  assert.equal(calls.leaderboard, 1);
});

test('a non-record and an already durable Daily are successful no-op steps', async () => {
  const { calls } = makeHarness({
    mode: 'daily',
    score: 400,
    best: 500,
    dailyResults: [STORAGE_WRITE_STATUS.unchanged]
  });

  await endScreen.endGame();

  assert.equal(calls.record, 0);
  assert.equal(calls.daily, 1);
  assert.equal(calls.complete, 1);
  assert.equal(session.getActiveGameSession().status, 'completed');
});

test('leaderboard failure cannot roll back a completed local finalization', async () => {
  const { calls } = makeHarness({
    leaderboard: () => Promise.reject(new Error('network failed'))
  });

  await endScreen.endGame();
  await Promise.resolve();

  assert.equal(calls.leaderboard, 1);
  assert.equal(calls.order.at(-1), 'leaderboard');
  assert.equal(session.getActiveGameSession().status, 'completed');
  assert.equal(endScreen.getPendingFinalizationForTests(), null);
});

test('losing the in-memory session while finalizing removes the pending retry', async () => {
  const { calls } = makeHarness({ persistResults: [false, true] });
  await endScreen.endGame();
  assert.ok(endScreen.getPendingFinalizationForTests());

  session.resetGameSessionForTests();
  await endScreen.endGame();

  assert.equal(endScreen.getPendingFinalizationForTests(), null);
  assert.equal(calls.build, 1);
  assert.equal(calls.record, 0);
  assert.equal(calls.complete, 0);

  G.screen = 'gameplay';
  session.createGameSession('normal', 2000);
  const challenge = session.markChallengeShown('math');
  session.recordChallengeResult(challenge, 'good');
  await endScreen.endGame();

  assert.equal(calls.build, 2);
  assert.equal(calls.persist.length, 2);
  assert.equal(calls.persist[1].stats.gamesCompleted, 1);
  assert.equal(session.getActiveGameSession().status, 'completed');
});
