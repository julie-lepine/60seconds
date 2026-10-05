import { t } from '../i18n.js';
import { G } from '../state.js';
import { escapeHtml, fmt, clearGameTimers } from '../utils.js';
import { sImpact } from '../audio.js';
import {
  saveBestScore,
  saveTodayDailyRun,
  STORAGE_WRITE_STATUS
} from '../storage.js';
import { submitLeaderboardScore } from '../leaderboard/leaderboard.js';
import { view } from '../dom.js';
import { startCountdown } from './countdown.js';
import { renderHome } from './home.js';
import {
  beginSessionFinalization,
  completeSessionFinalization,
  getActiveGameSession
} from '../achievements/session.js';
import {
  buildCompletionCandidate,
  evaluateAchievements,
  getEffectiveStreak,
  localDateKey,
  utcDateKey
} from '../achievements/progress.js';
import {
  getAchievementProgress,
  persistAchievementProgress
} from '../achievements/storage.js';
import { localizeAchievement } from '../achievements/presentation.js';

const defaultFinalizationDependencies = Object.freeze({
  getActiveGameSession,
  beginSessionFinalization,
  completeSessionFinalization,
  buildCompletionCandidate,
  evaluateAchievements,
  getAchievementProgress,
  persistAchievementProgress,
  saveBestScore,
  saveTodayDailyRun,
  submitLeaderboardScore
});

let finalizationDependencies = defaultFinalizationDependencies;
let pendingFinalization = null;

function deepFreeze(value, seen = new WeakSet()){
  if(!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for(const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function renderSaving(state){
  view.innerHTML = `<div class="screen" id="screen-end">
    <div class="end-label label">${t('score')}</div>
    <div class="end-score display">${fmt(state.score)}</div>
    <div class="end-delta ui show">SAUVEGARDE…</div>
  </div>`;
}

function renderSaveError(state){
  view.innerHTML = `<div class="screen" id="screen-end">
    <div class="end-label label">${t('score')}</div>
    <div class="end-score display">${fmt(state.score)}</div>
    <div class="end-delta ui show">ÉCHEC DE LA SAUVEGARDE</div>
    <button class="again-btn show" id="retryFinalizeBtn">RÉESSAYER</button>
  </div>`;
  const retry = document.getElementById('retryFinalizeBtn');
  if(retry) retry.onclick = () => { void endGame(); };
}

function prepareFinalization(session){
  clearGameTimers();
  G.screen='end';

  const now = new Date();
  const isNew = G.score>G.best;
  const score = G.score;
  const previousBest = G.best;
  const previousProgress = finalizationDependencies.getAchievementProgress();
  const { candidate, completedSession } = finalizationDependencies.buildCompletionCandidate(previousProgress, session, {
    score,
    previousBest,
    recordBroken: isNew,
    localDate: localDateKey(now),
    dailyDate: utcDateKey(now),
    completedAt: now.toISOString()
  });
  const evaluated = finalizationDependencies.evaluateAchievements(previousProgress, candidate, completedSession);
  deepFreeze(candidate);
  deepFreeze(completedSession);
  deepFreeze(evaluated.progress);
  deepFreeze(evaluated.newlyUnlocked);

  return {
    sessionId: session.sessionId,
    mode: session.mode,
    score,
    previousBest,
    isNew,
    delta: score - previousBest,
    now,
    previousProgress,
    candidate,
    completedSession,
    evaluated,
    progressionSaved: false,
    recordSaved: !isNew,
    dailySaved: session.mode !== 'daily',
    sessionCompleted: false,
    leaderboardSubmitted: false,
    failedStage: null,
    inFlight: null
  };
}

function renderCompletedEnd(state){
  const effectiveProgress = state.evaluated.progress;
  const streakResult = getEffectiveStreak(effectiveProgress, state.now);
  streakResult.increased =
    state.previousProgress.stats.lastPlayedLocalDate !== effectiveProgress.stats.lastPlayedLocalDate;
  const streakText = t(streakResult.count === 1 ? 'streakDay' : 'streakDays', { count: fmt(streakResult.count) });
  const newlyUnlocked = state.evaluated.newlyUnlocked;
  const visibleUnlocked = newlyUnlocked.slice(0, 3);
  const remainingUnlocked = Math.max(0, newlyUnlocked.length - visibleUnlocked.length);
  const unlockedHtml = newlyUnlocked.length ? `
    <div class="end-achievements">
      <div class="end-achievements-label ui">${t(newlyUnlocked.length === 1 ? 'achievementUnlocked' : 'achievementsUnlocked')}</div>
      ${visibleUnlocked.map(item => `<div class="end-achievement-title display">${escapeHtml(localizeAchievement(item).title)}</div>`).join('')}
      ${remainingUnlocked ? `<div class="end-achievements-more ui">${t('otherAchievements', { count: remainingUnlocked })}</div>` : ''}
    </div>` : '';

  setTimeout(()=>{
    const el=document.getElementById('screen-end');
    if(!el) return;
    const again = state.mode==='daily' ? '' : `<button class="again-btn" id="againBtn">${t('playAgain')}</button>`;
    el.innerHTML = `
      <div class="end-label label">${t('score')}</div>
      <div class="end-score display" id="scoreNum">0</div>
      <div class="end-delta ui" id="deltaLine">${state.isNew?t('newRecord'):(state.previousBest>0?t('vsRecord',{delta:`${state.delta>=0?'+':''}${fmt(state.delta)}`}):t('firstScore'))}</div>
      ${streakResult.increased ? `<div class="end-streak ui" id="streakLine"><span class="streak-flame" aria-hidden="true"></span>${streakText}</div>` : ''}
      ${unlockedHtml}
      ${again}
      <div class="home-link" id="homeLink">${t('home')}</div>`;
    if(state.isNew) el.querySelector('#deltaLine').classList.add('new');
    const scoreEl=document.getElementById('scoreNum');
    if(G.reduceMotion){
      if(scoreEl) scoreEl.textContent=fmt(state.score);
      document.getElementById('deltaLine')?.classList.add('show');
      document.getElementById('streakLine')?.classList.add('show');
      document.getElementById('againBtn')?.classList.add('show');
      document.getElementById('homeLink')?.classList.add('show');
    }else{
      animateScore(scoreEl, state.score, ()=>{
        document.getElementById('deltaLine')?.classList.add('show');
        document.getElementById('streakLine')?.classList.add('show');
        setTimeout(()=>{
          document.getElementById('againBtn')?.classList.add('show');
          document.getElementById('homeLink')?.classList.add('show');
        },250);
      });
    }
    document.getElementById('againBtn')?.addEventListener('click', ()=>startCountdown(state.mode));
    document.getElementById('homeLink').onclick=renderHome;
  }, 650);
}

function failFinalization(state, stage){
  state.failedStage = stage;
  renderSaveError(state);
  return [];
}

async function runFinalization(state){
  try{
    state.failedStage = null;
    renderSaving(state);

    if(!state.progressionSaved){
      state.failedStage = 'progression';
      const saved = await finalizationDependencies.persistAchievementProgress(state.evaluated.progress);
      if(saved !== true) return failFinalization(state, 'progression');
      state.progressionSaved = true;
    }

    if(!state.recordSaved){
      state.failedStage = 'record';
      const status = finalizationDependencies.saveBestScore(state.mode, state.score);
      if(status === STORAGE_WRITE_STATUS.failed) return failFinalization(state, 'record');
      if(status !== STORAGE_WRITE_STATUS.saved && status !== STORAGE_WRITE_STATUS.unchanged){
        return failFinalization(state, 'record');
      }
      state.recordSaved = true;
      G.best = state.score;
    }

    if(!state.dailySaved){
      state.failedStage = 'daily';
      const status = finalizationDependencies.saveTodayDailyRun(state.score);
      if(status === STORAGE_WRITE_STATUS.failed) return failFinalization(state, 'daily');
      if(status !== STORAGE_WRITE_STATUS.saved && status !== STORAGE_WRITE_STATUS.unchanged){
        return failFinalization(state, 'daily');
      }
      state.dailySaved = true;
    }

    if(!state.sessionCompleted){
      state.failedStage = 'session';
      const completed = finalizationDependencies.completeSessionFinalization(state.sessionId);
      if(completed !== true) return failFinalization(state, 'session');
      state.sessionCompleted = true;
    }

    state.failedStage = null;
    if(!state.leaderboardSubmitted){
      state.leaderboardSubmitted = true;
      try{
        void Promise.resolve(
          finalizationDependencies.submitLeaderboardScore(state.mode, state.score)
        ).catch(() => null);
      }catch{}
    }

    sImpact();
    renderCompletedEnd(state);
    pendingFinalization = null;
    return state.evaluated.newlyUnlocked;
  }catch{
    return failFinalization(state, state.failedStage || 'unknown');
  }finally{
    if(pendingFinalization === state) state.inFlight = null;
  }
}

function startFinalization(state){
  const operation = runFinalization(state);
  state.inFlight = operation;
  return operation;
}

export function endGame(){
  const activeSession = finalizationDependencies.getActiveGameSession();

  if(pendingFinalization){
    if(pendingFinalization.inFlight) return pendingFinalization.inFlight;
    if(
      !activeSession ||
      activeSession.sessionId !== pendingFinalization.sessionId ||
      activeSession.status !== 'finalizing'
    ){
      pendingFinalization = null;
      return Promise.resolve([]);
    }
    return startFinalization(pendingFinalization);
  }

  if(!activeSession) return Promise.resolve([]);
  const session = finalizationDependencies.beginSessionFinalization(activeSession.sessionId);
  if(!session) return Promise.resolve([]);

  pendingFinalization = prepareFinalization(session);
  renderSaving(pendingFinalization);
  return startFinalization(pendingFinalization);
}

export function setEndGameDependenciesForTests(overrides = {}){
  finalizationDependencies = { ...defaultFinalizationDependencies, ...overrides };
}

export function getPendingFinalizationForTests(){
  return pendingFinalization;
}

export function resetEndGameForTests(){
  pendingFinalization = null;
  finalizationDependencies = defaultFinalizationDependencies;
}
function animateScore(el, target, done){
  if(!el){ done&&done(); return; }
  const dur=900; const t0=performance.now();
  function step(){
    if(!document.body.contains(el)){ done&&done(); return; }
    const p=Math.min(1,(performance.now()-t0)/dur);
    const eased=1-Math.pow(1-p,3);
    el.textContent=fmt(target*eased);
    if(p<1) requestAnimationFrame(step); else { el.textContent=fmt(target); done&&done(); }
  }
  step();
}
