import test from 'node:test';
import assert from 'node:assert/strict';

let fakeNow = 0;
const originalPerformance = globalThis.performance;
const originalRandom = Math.random;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

const elements = {
  view: { innerHTML: '' },
  runNum: { textContent: '0.00' },
  stopBtn: { onpointerdown: null },
  challengeArea: { innerHTML: '', style: {} }
};

Object.defineProperty(globalThis, 'performance', {
  configurable: true,
  value: { now: () => fakeNow }
});
globalThis.cancelAnimationFrame = () => {};
globalThis.document = {
  body: { contains: () => true },
  documentElement: { classList: { toggle: () => {} } },
  getElementById: id => elements[id] || null
};

const [{ timing }, { G }, session, { clearGameTimers }] = await Promise.all([
  import('../src/challenges/timing.js'),
  import('../src/state.js'),
  import('../src/achievements/session.js'),
  import('../src/utils.js')
]);

function randomForTarget(target){
  return (target - 1.5) / (3.4 - 1.5);
}

function runTimingAttempt({ target, elapsed, previousDisplay = '0.00' }){
  fakeNow = 0;
  Math.random = () => randomForTarget(target);
  elements.runNum.textContent = previousDisplay;
  elements.stopBtn.onpointerdown = null;
  elements.challengeArea.innerHTML = '';
  elements.challengeArea.style = {};
  G.screen = 'gameplay';
  G.score = 0;
  G.sound = false;
  G.flashLock = false;
  G.endTime = 60000;

  session.createGameSession('normal', 0);
  const eventContext = session.markChallengeShown('timing');
  timing(elements.challengeArea, eventContext);
  fakeNow = elapsed * 1000;
  elements.stopBtn.onpointerdown();

  const result = {
    visible: elements.runNum.textContent,
    score: G.score,
    session: session.getActiveGameSession()
  };
  clearGameTimers();
  return result;
}

test.after(() => {
  Math.random = originalRandom;
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: originalPerformance
  });
  if(originalCancelAnimationFrame){
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  }else{
    delete globalThis.cancelAnimationFrame;
  }
  delete globalThis.document;
});

test('stopped timing display and achievement metadata use the same rounded value', () => {
  const result = runTimingAttempt({
    target: 2.37,
    elapsed: 2.37,
    previousDisplay: '2.36'
  });
  assert.equal(result.visible, '2.37');
  assert.deepEqual(result.session.timingAttempts, [
    { targetDisplayed: '2.37', stoppedDisplayed: '2.37' }
  ]);
  assert.equal(result.session.timingExact, true);
});

test('a nearby but different displayed hundredth remains Furieux without timingExact', () => {
  const result = runTimingAttempt({ target: 2.37, elapsed: 2.38 });
  assert.equal(result.visible, '2.38');
  assert.equal(result.session.timingExact, false);
  assert.equal(result.session.insaneCount, 1);
  assert.equal(result.score, 320);
});

test('Furieux keeps its strict less-than-50ms threshold and 320 points', () => {
  const result = runTimingAttempt({ target: 1.5, elapsed: 1.549 });
  assert.equal(result.session.insaneCount, 1);
  assert.equal(result.score, 320);
});

test('an attempt at the existing 50ms boundary is good and keeps 180 points', () => {
  const result = runTimingAttempt({ target: 1.5, elapsed: 1.55 });
  assert.equal(result.session.insaneCount, 0);
  assert.equal(result.session.errors, 0);
  assert.equal(result.score, 180);
});

test('a timing miss keeps zero points and records an error', () => {
  const result = runTimingAttempt({ target: 1.5, elapsed: 1.681 });
  assert.equal(result.session.insaneCount, 0);
  assert.equal(result.session.errors, 1);
  assert.equal(result.score, 0);
});
