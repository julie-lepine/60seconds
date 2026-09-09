import { t } from '../i18n.js';
import { G } from '../state.js';
import { savePrivacyNotice, saveAdsTracking } from '../storage.js';
import { view } from '../dom.js';

function consentCopy(){
  return `
    <div class="consent-copy">
      <div class="settings-title display">${t('consentTitle')}</div>
      <p>${t('consentLeaderboard')}</p>
      <p>${t('consentAds')}</p>
      <p>${t('consentChoice')}</p>
    </div>`;
}

export function renderConsent({ onDone, onBack }={}){
  G.screen='consent';
  const info = !!onBack;
  view.innerHTML = `
    <div class="screen${info?'':' consent-first'}" id="screen-consent">
      ${info?`<div class="topnav"><div class="navlink" id="consentBack">← ${t('back')}</div><div></div></div>`:''}
      ${consentCopy()}
      ${info?'':`<div class="consent-actions">
        <button class="pseudo-btn" id="consentAccept" type="button">${t('consentAccept')}</button>
        <div class="navlink" id="consentDecline">${t('consentDecline')}</div>
      </div>`}
    </div>`;
  if(info){
    document.getElementById('consentBack').onclick=onBack;
    return;
  }
  const finish=(tracking)=>{
    savePrivacyNotice();
    saveAdsTracking(tracking);
    onDone&&onDone();
  };
  document.getElementById('consentAccept').onclick=()=>finish(true);
  document.getElementById('consentDecline').onclick=()=>finish(false);
}
