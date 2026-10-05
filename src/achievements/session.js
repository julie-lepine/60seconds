let activeSession = null;
let fallbackId = 0;

function makeSessionId(){
  try{
    if(typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  }catch{}
  fallbackId += 1;
  return `game-${Date.now()}-${fallbackId}`;
}

function publicSnapshot(session){
  if(!session) return null;
  return {
    sessionId: session.sessionId,
    mode: session.mode,
    startedAt: session.startedAt,
    status: session.status,
    challengesResolved: session.challengesResolved,
    errors: session.errors,
    insaneCount: session.insaneCount,
    seenTypes: [...session.seenTypes],
    succeededTypes: [...session.succeededTypes],
    timingAttempts: session.timingAttempts.map(attempt => ({ ...attempt })),
    timingExact: session.timingExact
  };
}

export function createGameSession(mode, startedAt = Date.now()){
  activeSession = {
    sessionId: makeSessionId(),
    mode: mode === 'daily' ? 'daily' : 'normal',
    startedAt: Number.isFinite(startedAt) ? startedAt : Date.now(),
    status: 'running',
    challengesResolved: 0,
    errors: 0,
    insaneCount: 0,
    seenTypes: new Set(),
    succeededTypes: new Set(),
    timingAttempts: [],
    timingExact: false,
    challengeSequence: 0,
    currentChallengeSequence: 0,
    currentChallengeType: null,
    resolvedChallenges: new Set()
  };
  return publicSnapshot(activeSession);
}

export function getActiveGameSession(){
  return publicSnapshot(activeSession);
}

export function markChallengeShown(challengeType){
  if(!activeSession || activeSession.status !== 'running') return null;
  if(typeof challengeType !== 'string' || !challengeType) return null;
  activeSession.challengeSequence += 1;
  activeSession.currentChallengeSequence = activeSession.challengeSequence;
  activeSession.currentChallengeType = challengeType;
  activeSession.seenTypes.add(challengeType);
  return Object.freeze({
    sessionId: activeSession.sessionId,
    challengeSequence: activeSession.currentChallengeSequence,
    challengeType
  });
}

function isCurrentEvent(context){
  return !!(
    activeSession &&
    activeSession.status === 'running' &&
    context &&
    context.sessionId === activeSession.sessionId &&
    context.challengeSequence === activeSession.currentChallengeSequence &&
    typeof context.challengeType === 'string' &&
    context.challengeType === activeSession.currentChallengeType
  );
}

export function recordChallengeResult(context, kind, metadata = null){
  if(!isCurrentEvent(context)) return false;
  if(activeSession.resolvedChallenges.has(context.challengeSequence)) return false;
  if(kind !== 'bad' && kind !== 'good' && kind !== 'insane') return false;

  activeSession.resolvedChallenges.add(context.challengeSequence);
  activeSession.challengesResolved += 1;

  if(kind === 'bad'){
    activeSession.errors += 1;
  }else{
    activeSession.succeededTypes.add(context.challengeType);
    if(kind === 'insane') activeSession.insaneCount += 1;
  }

  const timing = metadata?.timing;
  if(context.challengeType === 'timing' && timing){
    const targetDisplayed = String(timing.targetDisplayed ?? '');
    const stoppedDisplayed = String(timing.stoppedDisplayed ?? '');
    if(targetDisplayed && stoppedDisplayed){
      activeSession.timingAttempts.push({ targetDisplayed, stoppedDisplayed });
      if(kind !== 'bad' && targetDisplayed === stoppedDisplayed){
        activeSession.timingExact = true;
      }
    }
  }
  return true;
}

export function beginSessionFinalization(sessionId){
  if(!activeSession) return null;
  if(activeSession.sessionId !== sessionId) return null;
  if(activeSession.status !== 'running') return null;
  activeSession.status = 'finalizing';
  return publicSnapshot(activeSession);
}

export function completeSessionFinalization(sessionId){
  if(!activeSession || activeSession.sessionId !== sessionId) return false;
  if(activeSession.status !== 'finalizing') return false;
  activeSession.status = 'completed';
  return true;
}

export function abandonGameSession(sessionId){
  if(!activeSession || activeSession.sessionId !== sessionId) return false;
  if(activeSession.status !== 'running') return false;
  activeSession = null;
  return true;
}

export function resetGameSessionForTests(){
  activeSession = null;
  fallbackId = 0;
}
