import { Capacitor } from '@capacitor/core';
import { t } from '../i18n.js';
import { G } from '../state.js';
import { sPop } from '../audio.js';
import { getUsername, saveReduceMotion, saveSound, getAdsTracking, saveAdsTracking } from '../storage.js';
import { refreshAds, openPrivacyOptions } from '../ads.js';
import { view } from '../dom.js';
import { renderHome } from './home.js';
import { renderUsername } from './username.js';
import { renderConsent } from './consent.js';
import { isNotificationSupported, getNotificationPrefs, saveNotificationPrefs, enableNotifications, disableNotifications, syncNotifications } from '../notifications.js';

export function renderSettings(){
  G.screen='settings';
  const tracking = getAdsTracking();
  const native = Capacitor.isNativePlatform();
  const notif = getNotificationPrefs();
  const notifSupported = isNotificationSupported();
  view.innerHTML = `
    <div class="screen" id="screen-settings">
      <div class="topnav"><div class="navlink" id="backHome2">← ${t('home')}</div><div></div></div>
      <div class="settings-title display">${t('settings')}</div>
      <div class="set-row">
        <div>
          <div class="set-name ui">${t('username')}</div>
          <div class="pseudo-value display" id="pseudoValue"></div>
        </div>
        <div class="navlink" id="editPseudo">${t('edit')}</div>
      </div>
      <div class="set-row"><div class="set-name ui">${t('sound')}</div><div class="toggle ${G.sound?'on':''}" id="tgSound"><div class="knob"></div></div></div>
      <div class="set-row"><div class="set-name ui">${t('reduceMotion')}</div><div class="toggle ${G.reduceMotion?'on':''}" id="tgMotion"><div class="knob"></div></div></div>
      ${notifSupported?`<div class="set-row"><div class="set-name ui">${t('notifSetting')}</div><div class="toggle ${notif.enabled?'on':''}" id="tgNotif"><div class="knob"></div></div></div>
      <div class="set-note ui" id="notifBlocked" hidden>${t('notifBlocked')}</div>
      <div class="set-row" id="notifTimeRow" ${notif.enabled?'':'hidden'}><div class="set-name ui">${t('notifTimeLabel')}</div><input class="set-time" id="notifTime" type="time" value="${notif.time}"></div>`:''}
      <div class="set-row"><div class="set-name ui">${t('adsTracking')}</div><div class="toggle ${tracking?'on':''}" id="tgTracking"><div class="knob"></div></div></div>
      <div class="set-row">
        <div class="set-name ui">${t('privacy')}</div>
        <div class="navlink" id="openPrivacy">${t('privacyView')}</div>
      </div>
      ${native?`<div class="set-row">
        <div class="set-name ui">${t('privacyManage')}</div>
        <div class="navlink" id="openAdChoices">${t('privacyManageAction')}</div>
      </div>`:''}
      <div class="set-row"><div class="set-name ui">${t('about')}</div><div class="ui" style="font-size:12px;color:var(--black-40);">${t('aboutValue')}</div></div>
    </div>`;
  document.getElementById('pseudoValue').textContent=getUsername();
  document.getElementById('editPseudo').onclick=()=>renderUsername({
    initial: getUsername(),
    title: t('username'),
    submitLabel: t('save'),
    onDone: renderSettings,
    onBack: renderSettings
  });
  document.getElementById('backHome2').onclick=renderHome;
  document.getElementById('tgSound').onclick=(e)=>{
    const on=saveSound(!G.sound);
    e.currentTarget.classList.toggle('on', on);
    if(on) sPop();
  };
  document.getElementById('tgMotion').onclick=(e)=>{
    const on=saveReduceMotion(!G.reduceMotion);
    e.currentTarget.classList.toggle('on', on);
  };
  document.getElementById('tgNotif')?.addEventListener('click', async (e)=>{
    const toggle = e.currentTarget;
    const row = document.getElementById('notifTimeRow');
    const blocked = document.getElementById('notifBlocked');
    if(toggle.classList.contains('on')){
      toggle.classList.remove('on');
      if(row) row.hidden = true;
      if(blocked) blocked.hidden = true;
      await disableNotifications();
      return;
    }
    if(toggle.dataset.busy === '1') return;
    toggle.dataset.busy = '1';
    let granted = false;
    try{
      granted = (await enableNotifications()) === 'granted';
    }catch(error){
      granted = false;
    }
    toggle.dataset.busy = '';
    toggle.classList.toggle('on', granted);
    if(row) row.hidden = !granted;
    if(blocked){
      blocked.textContent = t('notifBlocked');
      blocked.hidden = granted;
    }
  });
  document.getElementById('notifTime')?.addEventListener('change', (e)=>{
    if(!e.currentTarget.value) return;
    saveNotificationPrefs({ time: e.currentTarget.value });
    void syncNotifications();
  });
  document.getElementById('tgTracking').onclick=(e)=>{
    const on=saveAdsTracking(!getAdsTracking());
    e.currentTarget.classList.toggle('on', on);
    refreshAds();
  };
  document.getElementById('openPrivacy').onclick=()=>renderConsent({ onBack: renderSettings });
  document.getElementById('openAdChoices')?.addEventListener('click', ()=>openPrivacyOptions());
}
