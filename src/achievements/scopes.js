const CHALLENGE_SCOPE_V1_TYPES = Object.freeze([
  'tap',
  'math',
  'timing',
  'oddoneout',
  'reaction',
  'memory',
  'greater',
  'count',
  'evenodd',
  'leftright',
  'goNoGo',
  'sequence',
  'direction',
  'stroop'
]);

export const CHALLENGE_SCOPES = Object.freeze({
  challenge_scope_v1: Object.freeze({
    id: 'challenge_scope_v1',
    challengeIds: CHALLENGE_SCOPE_V1_TYPES
  })
});

export function validateChallengeScopes(challengeRegistry){
  if(!challengeRegistry || typeof challengeRegistry !== 'object'){
    throw new Error('Achievement scopes: challenge registry is unavailable.');
  }

  for(const scope of Object.values(CHALLENGE_SCOPES)){
    const unique = new Set(scope.challengeIds);
    if(unique.size !== scope.challengeIds.length){
      throw new Error(`Achievement scope "${scope.id}" contains duplicate challenge IDs.`);
    }
    for(const challengeId of scope.challengeIds){
      if(typeof challengeRegistry[challengeId] !== 'function'){
        throw new Error(`Achievement scope "${scope.id}" references missing challenge "${challengeId}".`);
      }
    }
  }
  return true;
}

export function getChallengeScope(scopeId){
  return CHALLENGE_SCOPES[scopeId] || null;
}

export function countScopeProgress(values, scopeId){
  const scope = getChallengeScope(scopeId);
  if(!scope) return { current: 0, total: 0, complete: false };
  const collected = new Set(Array.isArray(values) ? values : []);
  const current = scope.challengeIds.reduce(
    (count, challengeId) => count + (collected.has(challengeId) ? 1 : 0),
    0
  );
  return {
    current,
    total: scope.challengeIds.length,
    complete: current === scope.challengeIds.length
  };
}
