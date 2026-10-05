import { applyDocumentLang } from './i18n.js';
import { applyReduceMotion, applySound, getUsername, hasPrivacyNotice } from './storage.js';
import { initAds } from './ads.js';
import { renderHome } from './screens/home.js';
import { renderUsername } from './screens/username.js';
import { renderConsent } from './screens/consent.js';
import { initializeAchievementProgress } from './achievements/storage.js';

applyDocumentLang();
applyReduceMotion();
applySound();

async function continueBoot(){
  await initializeAchievementProgress();
  initAds();
  if(getUsername()) renderHome();
  else renderUsername({ onDone: renderHome });
}

if(hasPrivacyNotice()) continueBoot();
else renderConsent({ onDone: continueBoot });
