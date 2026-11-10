import test from 'node:test';
import assert from 'node:assert/strict';

// Les consignes du premier passage ne doivent pas s'intercaler dans ces tests.
globalThis.localStorage = { getItem: () => JSON.stringify(['tap','math','timing','oddoneout','reaction','memory','greater','count','evenodd','leftright','goNoGo','sequence','direction','stroop']), setItem: () => {}, removeItem: () => {} };
const originalDocument = globalThis.document;
const originalMathRandom = Math.random;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
globalThis.cancelAnimationFrame = () => {};

function fakeElement(){
  const el = {
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    onpointerdown: null,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    querySelector: () => fakeElement(),
    querySelectorAll: () => []
  };
  return el;
}

let area = fakeElement();
globalThis.document = {
  body: { contains: () => true },
  getElementById: id => (id === 'challengeArea' ? area : fakeElement())
};

const [{ G }, { CHALLENGES }, { CHALLENGE_TYPES }, daily, engine, session, utils] = await Promise.all([
  import('../src/state.js'),
  import('../src/challenges/challenges.js'),
  import('../src/constants.js'),
  import('../src/game/daily.js'),
  import('../src/game/engine.js'),
  import('../src/achievements/session.js'),
  import('../src/utils.js')
]);

test.after(() => {
  Math.random = originalMathRandom;
  utils.clearGameTimers();
  G.rng = null;
  if(originalCancelAnimationFrame) globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  else delete globalThis.cancelAnimationFrame;
  if(originalDocument) globalThis.document = originalDocument;
  else delete globalThis.document;
});

// Joue la création d'un défi avec un générateur à graine et renvoie ce qu'un joueur voit,
// plus la liste des tirages consommés (le délai de reaction, par exemple, n'est pas visible).
function createSeeded(type, index, seed){
  const base = daily.makeDailyRng(index, seed);
  const draws = [];
  G.rng = () => { const v = base(); draws.push(v); return v; };
  Math.random = () => { throw new Error(`Math.random utilisé par le défi « ${type} »`); };
  area = fakeElement();
  try{
    CHALLENGES[type](area, null);
  }finally{
    Math.random = originalMathRandom;
    utils.clearGameTimers();
    G.rng = null;
  }
  return { html: area.innerHTML, draws };
}

test('chaque défi est identique pour deux joueurs avec la même graine, sans Math.random', () => {
  for(const type of CHALLENGE_TYPES){
    for(let index = 0; index < 5; index++){
      const a = createSeeded(type, index, 20261103);
      const b = createSeeded(type, index, 20261103);
      assert.equal(a.html, b.html, `${type} #${index} : contenu différent`);
      assert.deepEqual(a.draws, b.draws, `${type} #${index} : tirages différents`);
    }
  }
});

test('un autre jour donne un autre contenu', () => {
  const day = seed => CHALLENGE_TYPES.map(type => {
    const out = [];
    for(let index = 0; index < 5; index++) out.push(createSeeded(type, index, seed).html);
    return out.join('|');
  }).join('||');
  assert.notEqual(day(20261103), day(20261104));
});

test('le rang du défi change son contenu mais pas celui des autres rangs', () => {
  const first = daily.makeDailyRng(0, 20261103)();
  const second = daily.makeDailyRng(1, 20261103)();
  assert.notEqual(first, second);
  assert.equal(daily.makeDailyRng(1, 20261103)(), second);
});

function playDaily(count){
  G.mode = 'daily';
  G.screen = 'gameplay';
  G.score = 0;
  G.lastType = null;
  G.flashLock = false;
  G.dailyPick = daily.makeDailyPicker();
  G.dailyIndex = 0;
  G.rng = null;
  G.endTime = performance.now() + 60000;
  session.createGameSession('daily');
  const seen = [];
  area = fakeElement();
  for(let i = 0; i < count; i++){
    engine.nextChallenge();
    seen.push(area.innerHTML);
  }
  utils.clearGameTimers();
  return seen;
}

test('une partie du défi quotidien affiche la même suite de défis à chaque fois', () => {
  Math.random = () => { throw new Error('Math.random utilisé en mode quotidien'); };
  let first, second;
  try{
    first = playDaily(40);
    second = playDaily(40);
  }finally{
    Math.random = originalMathRandom;
  }
  assert.equal(first.length, 40);
  assert.deepEqual(first, second);
});

test('le mode normal reste aléatoire', () => {
  function playNormal(count){
    G.mode = 'normal';
    G.screen = 'gameplay';
    G.lastType = null;
    G.flashLock = false;
    G.dailyPick = null;
    G.dailyIndex = 0;
    G.rng = null;
    G.endTime = performance.now() + 60000;
    session.createGameSession('normal');
    const seen = [];
    area = fakeElement();
    for(let i = 0; i < count; i++){ engine.nextChallenge(); seen.push(area.innerHTML); }
    utils.clearGameTimers();
    return seen;
  }
  assert.notDeepEqual(playNormal(40), playNormal(40));
  assert.equal(G.rng, null);
});
