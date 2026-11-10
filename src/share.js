import { t } from './i18n.js';
import { fmt } from './utils.js';
import { SHARE_URL } from './constants.js';

// Message de défi : score, mode et lien (page du jeu, qui oriente vers le bon store).
export function buildChallengeText(mode, score){
  const key = mode === 'daily' ? 'shareDaily' : (mode === 'hardcore' ? 'shareHardcore' : 'shareNormal');
  return t(key, { score: fmt(score).replace(/\u202F/g, ' '), url: SHARE_URL });
}

function isCancel(err){
  return /cancel/i.test(String(err?.message || err || ''));
}

async function copyToClipboard(text){
  try{
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      return true;
    }
  }catch{}
  return false;
}

// Renvoie 'shared' | 'cancelled' | 'copied' | 'failed'.
// `deps.Share` permet d'injecter le plugin dans les tests.
export async function shareChallenge(mode, score, deps = {}){
  const text = buildChallengeText(mode, score);
  try{
    const Share = deps.Share || (await import('@capacitor/share')).Share;
    const available = await Share.canShare();
    if(available?.value){
      await Share.share({ text, dialogTitle: t('shareChallenge') });
      return 'shared';
    }
  }catch(err){
    if(isCancel(err)) return 'cancelled';
  }
  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}
