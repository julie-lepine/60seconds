import { applyDocumentLang } from './i18n.js';
import { applyReduceMotion, applySound, getUsername, hasPrivacyNotice } from './storage.js';
import { initAds } from './ads.js';
import { renderHome } from './screens/home.js';
import { renderUsername } from './screens/username.js';
import { renderConsent } from './screens/consent.js';
import { initializeAchievementProgress } from './achievements/storage.js';
import { syncNotifications } from './notifications.js';
import { maybeShowUpdateModal } from './update.js';

applyDocumentLang();
applyReduceMotion();
applySound();

async function continueBoot(){
  await initializeAchievementProgress();
  initAds();
  void syncNotifications();
  // Au retour dans l'app, on reprogramme les rappels (la journée a pu changer).
  try{
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'visible') void syncNotifications();
    });
  }catch{}
  if(getUsername()){
    renderHome();
    void maybeShowUpdateModal();
  }else renderUsername({ onDone: () => { renderHome(); void maybeShowUpdateModal(); } });
}

if(hasPrivacyNotice()) continueBoot();
else renderConsent({ onDone: continueBoot });
