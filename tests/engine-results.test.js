import test from 'node:test';
import assert from 'node:assert/strict';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

let soundStarts = 0;

class FakeAudioContext {
  constructor(){
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }

  createOscillator(){
    return {
      type: 'sine',
      frequency: {
        value: 0,
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {},
      start: () => { soundStarts += 1; },
      stop: () => {}
    };
  }

  createGain(){
    return {
      gain: {
        value: 0,
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {}
    };
  }

  resume(){}
}

let challengeArea = null;
const timerNum = {
  textContent: '',
  classList: { toggle: () => {} }
};
globalThis.window = { AudioContext: FakeAudioContext };
globalThis.document = {
  getElementById: id => {
    if(id === 'challengeArea') return challengeArea;
    if(id === 'timerNum') return timerNum;
    return null;
  }
};

const [
  { resultFlash },
  { tickTimer },
  { G },
  session
] = await Promise.all([
  import('../src/game/engine.js'),
  import('../src/game/timer.js'),
  import('../src/state.js'),
  import('../src/achievements/session.js')
]);

function makeArea(content = '<div id="current">B</div>'){
  let html = content;
  let writes = 0;
  return {
    style: { background: 'challenge' },
    get innerHTML(){ return html; },
    set innerHTML(value){ html = value; writes += 1; },
    get writes(){ return writes; }
  };
}

function captureTimers(action){
  const scheduled = [];
  const cleared = [];
  globalThis.setTimeout = (callback, delay) => {
    const id = { callback, delay };
    scheduled.push(id);
    return id;
  };
  globalThis.clearTimeout = id => { cleared.push(id); };
  try{
    action();
  }finally{
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
  return { scheduled, cleared };
}

function snapshotGameplay(){
  return {
    score: G.score,
    flashLock: G.flashLock,
    html: challengeArea?.innerHTML,
    writes: challengeArea?.writes,
    soundStarts,
    session: session.getActiveGameSession()
  };
}

function assertNoGameplayEffect(before, timers){
  assert.deepEqual(snapshotGameplay(), before);
  assert.equal(timers.scheduled.length, 0);
}

test.beforeEach(() => {
  session.resetGameSessionForTests();
  challengeArea = makeArea();
  soundStarts = 0;
  G.screen = 'gameplay';
  G.score = 0;
  G.sound = true;
  G.flashLock = false;
  G.flashTimeout = null;
  G.chalTimeout = null;
  G.lastSecMark = null;
  G.endTime = performance.now() + 60000;
});

test.after(() => {
  session.resetGameSessionForTests();
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  if(originalRequestAnimationFrame === undefined) delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  if(originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if(originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test('an accepted result applies gameplay effects and schedules the existing transition once', () => {
  session.createGameSession('normal');
  const context = session.markChallengeShown('math');

  const timers = captureTimers(() => resultFlash('good', 150, context));

  assert.equal(G.score, 150);
  assert.equal(G.flashLock, true);
  assert.match(challengeArea.innerHTML, /feedback display good/);
  assert.equal(challengeArea.writes, 1);
  assert.equal(soundStarts, 1);
  assert.equal(timers.scheduled.length, 1);
  assert.equal(timers.scheduled[0].delay, 500);
  assert.equal(session.getActiveGameSession().challengesResolved, 1);
});

test('a stale result cannot affect B, and B can still resolve normally', () => {
  session.createGameSession('normal');
  const contextA = session.markChallengeShown('math');
  const contextB = session.markChallengeShown('tap');
  const before = snapshotGameplay();

  const rejectedTimers = captureTimers(() => resultFlash('insane', 260, contextA));
  assertNoGameplayEffect(before, rejectedTimers);

  const acceptedTimers = captureTimers(() => resultFlash('good', 150, contextB));
  assert.equal(G.score, 150);
  assert.equal(G.flashLock, true);
  assert.equal(soundStarts, 1);
  assert.equal(acceptedTimers.scheduled.length, 1);
  assert.equal(session.getActiveGameSession().challengesResolved, 1);
});

test('a duplicate result after the UI lock is released remains totally inert', () => {
  session.createGameSession('normal');
  const context = session.markChallengeShown('math');
  const firstTimers = captureTimers(() => resultFlash('good', 150, context));
  assert.equal(firstTimers.scheduled.length, 1);

  G.flashLock = false;
  const beforeDuplicate = snapshotGameplay();
  const duplicateTimers = captureTimers(() => resultFlash('good', 150, context));

  assertNoGameplayEffect(beforeDuplicate, duplicateTimers);
  assert.equal(session.getActiveGameSession().challengesResolved, 1);
});

test('two successive callbacks produce one score, feedback, sound and transition', () => {
  session.createGameSession('normal');
  const context = session.markChallengeShown('math');

  const timers = captureTimers(() => {
    resultFlash('good', 150, context);
    resultFlash('good', 150, context);
  });

  assert.equal(G.score, 150);
  assert.equal(challengeArea.writes, 1);
  assert.equal(soundStarts, 1);
  assert.equal(timers.scheduled.length, 1);
  assert.equal(session.getActiveGameSession().challengesResolved, 1);
});

test('non-string and mismatched challenge types are rejected without gameplay effects', () => {
  const created = session.createGameSession('normal');
  const current = session.markChallengeShown('math');
  const contexts = [
    { ...current, challengeType: null },
    { ...current, challengeType: 'tap' },
    { ...current, sessionId: `${created.sessionId}-old` }
  ];

  for(const context of contexts){
    const before = snapshotGameplay();
    const timers = captureTimers(() => resultFlash('good', 150, context));
    assertNoGameplayEffect(before, timers);
  }
});

test('finalizing and completed sessions reject results without gameplay effects', () => {
  const created = session.createGameSession('normal');
  const context = session.markChallengeShown('math');
  session.beginSessionFinalization(created.sessionId);

  let before = snapshotGameplay();
  let timers = captureTimers(() => resultFlash('good', 150, context));
  assertNoGameplayEffect(before, timers);

  session.completeSessionFinalization(created.sessionId);
  before = snapshotGameplay();
  timers = captureTimers(() => resultFlash('good', 150, context));
  assertNoGameplayEffect(before, timers);
});

test('missing session and invalid result kind are rejected without gameplay effects', () => {
  let before = snapshotGameplay();
  let timers = captureTimers(() => resultFlash('good', 150, {
    sessionId: 'missing',
    challengeSequence: 1,
    challengeType: 'math'
  }));
  assertNoGameplayEffect(before, timers);

  session.createGameSession('normal');
  const context = session.markChallengeShown('math');
  before = snapshotGameplay();
  timers = captureTimers(() => resultFlash('perfect', 999, context));
  assertNoGameplayEffect(before, timers);
});

test('a rejected result near expiry neither schedules a transition nor touches the next challenge timer', () => {
  session.createGameSession('normal');
  const stale = session.markChallengeShown('math');
  session.markChallengeShown('tap');
  G.endTime = performance.now() + 100;
  G.lastSecMark = 1;
  const nextChallengeTimer = { owner: 'B' };
  G.chalTimeout = nextChallengeTimer;
  const before = snapshotGameplay();

  const timers = captureTimers(() => resultFlash('insane', 260, stale));

  assertNoGameplayEffect(before, timers);
  assert.equal(G.chalTimeout, nextChallengeTimer);
  assert.equal(timers.cleared.includes(nextChallengeTimer), false);

  let animationFrameScheduled = false;
  globalThis.requestAnimationFrame = () => {
    animationFrameScheduled = true;
    return 1;
  };
  tickTimer();
  assert.equal(animationFrameScheduled, true);
});

test('a missing challenge area does not add points or consume the event', () => {
  session.createGameSession('normal');
  const context = session.markChallengeShown('math');
  challengeArea = null;

  const missingAreaTimers = captureTimers(() => resultFlash('good', 150, context));
  assert.equal(G.score, 0);
  assert.equal(G.flashLock, false);
  assert.equal(soundStarts, 0);
  assert.equal(missingAreaTimers.scheduled.length, 0);
  assert.equal(session.getActiveGameSession().challengesResolved, 0);

  challengeArea = makeArea();
  const acceptedTimers = captureTimers(() => resultFlash('good', 150, context));
  assert.equal(G.score, 150);
  assert.equal(acceptedTimers.scheduled.length, 1);
  assert.equal(session.getActiveGameSession().challengesResolved, 1);
});
