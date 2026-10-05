import test from 'node:test';
import assert from 'node:assert/strict';
import {
  beginSessionFinalization,
  completeSessionFinalization,
  createGameSession,
  getActiveGameSession,
  markChallengeShown,
  recordChallengeResult,
  resetGameSessionForTests
} from '../src/achievements/session.js';

test.beforeEach(() => resetGameSessionForTests());

test('session collects temporary seen, success, error and insane metrics', () => {
  const created = createGameSession('normal', 1000);
  assert.equal(created.status, 'running');
  assert.equal(created.mode, 'normal');

  const math = markChallengeShown('math');
  assert.equal(recordChallengeResult(math, 'good'), true);
  const reaction = markChallengeShown('reaction');
  assert.equal(recordChallengeResult(reaction, 'insane'), true);
  const memory = markChallengeShown('memory');
  assert.equal(recordChallengeResult(memory, 'bad'), true);

  const session = getActiveGameSession();
  assert.equal(session.challengesResolved, 3);
  assert.equal(session.errors, 1);
  assert.equal(session.insaneCount, 1);
  assert.deepEqual(session.seenTypes, ['math', 'reaction', 'memory']);
  assert.deepEqual(session.succeededTypes, ['math', 'reaction']);
});

test('timing exact uses equality of the two displayed hundredths', () => {
  createGameSession('daily');
  const exact = markChallengeShown('timing');
  recordChallengeResult(exact, 'insane', {
    timing: { targetDisplayed: '2.37', stoppedDisplayed: '2.37' }
  });
  assert.equal(getActiveGameSession().timingExact, true);
});

test('an old challenge callback and a duplicate result are ignored', () => {
  createGameSession('normal');
  const oldContext = markChallengeShown('math');
  const currentContext = markChallengeShown('tap');
  assert.equal(recordChallengeResult(oldContext, 'insane'), false);
  assert.equal(recordChallengeResult(currentContext, 'good'), true);
  assert.equal(recordChallengeResult(currentContext, 'good'), false);
  assert.equal(getActiveGameSession().challengesResolved, 1);
});

test('a callback from a previous session is ignored', () => {
  createGameSession('normal');
  const oldContext = markChallengeShown('math');
  createGameSession('daily');
  markChallengeShown('tap');
  assert.equal(recordChallengeResult(oldContext, 'insane'), false);
  assert.equal(getActiveGameSession().challengesResolved, 0);
});

test('the result type must match the currently displayed challenge type', () => {
  createGameSession('normal');
  const current = markChallengeShown('math');
  assert.equal(recordChallengeResult({ ...current, challengeType: null }, 'good'), false);
  assert.equal(recordChallengeResult({ ...current, challengeType: 'tap' }, 'good'), false);
  assert.equal(getActiveGameSession().challengesResolved, 0);
  assert.equal(recordChallengeResult(current, 'good'), true);
});

test('a future challenge type legitimately marked as shown can be resolved', () => {
  createGameSession('normal');
  const future = markChallengeShown('futureChallenge');
  assert.equal(recordChallengeResult(future, 'good'), true);
  assert.deepEqual(getActiveGameSession().succeededTypes, ['futureChallenge']);
});

test('finalization can be claimed and completed only once', () => {
  const created = createGameSession('normal');
  markChallengeShown('math');
  const first = beginSessionFinalization(created.sessionId);
  assert.equal(first.status, 'finalizing');
  assert.equal(beginSessionFinalization(created.sessionId), null);
  assert.equal(completeSessionFinalization(created.sessionId), true);
  assert.equal(completeSessionFinalization(created.sessionId), false);
  assert.equal(getActiveGameSession().status, 'completed');
});

test('interrupted in-memory activity does not mutate any persistent object', () => {
  const persistent = Object.freeze({ gamesCompleted: 0, seenTypes: Object.freeze([]) });
  createGameSession('normal');
  const context = markChallengeShown('math');
  recordChallengeResult(context, 'insane');
  resetGameSessionForTests();
  assert.deepEqual(persistent, { gamesCompleted: 0, seenTypes: [] });
});

for(const interruption of ['reload', 'closure', 'killed process']){
  test(`${interruption} discards all temporary challenge metrics`, () => {
    createGameSession('normal');
    const first = markChallengeShown('math');
    recordChallengeResult(first, 'insane');
    const second = markChallengeShown('memory');
    recordChallengeResult(second, 'bad');
    resetGameSessionForTests();
    assert.equal(getActiveGameSession(), null);
  });
}

test('background survival leaves the running session in memory without finalizing it', () => {
  const created = createGameSession('normal');
  const context = markChallengeShown('math');
  recordChallengeResult(context, 'good');
  const afterBackground = getActiveGameSession();
  assert.equal(afterBackground.sessionId, created.sessionId);
  assert.equal(afterBackground.status, 'running');
  assert.equal(afterBackground.challengesResolved, 1);
});
