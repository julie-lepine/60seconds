import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import { getAdsTracking } from './storage.js';

function publicEnv(name){
  try{
    const v = import.meta.env?.[name];
    if(v) return String(v).trim();
  }catch{}
  return '';
}

function bannerAdId(){
  const platform = Capacitor.getPlatform();
  if(platform === 'ios'){
    return publicEnv('VITE_ADMOB_BANNER_ID_IOS') || publicEnv('VITE_ADMOB_BANNER_ID');
  }
  if(platform === 'android'){
    return publicEnv('VITE_ADMOB_BANNER_ID_ANDROID') || publicEnv('VITE_ADMOB_BANNER_ID');
  }
  return publicEnv('VITE_ADMOB_BANNER_ID');
}

let started = false;

async function requestTrackingIfNeeded(){
  try{
    const tracking = await AdMob.trackingAuthorizationStatus();
    if(getAdsTracking() && tracking?.status === 'notDetermined'){
      await AdMob.requestTrackingAuthorization();
    }
  }catch{}
}

async function requestUmpConsent(){
  try{
    let consent = await AdMob.requestConsentInfo();
    if(consent?.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED){
      consent = await AdMob.showConsentForm();
    }
    if(consent && consent.canRequestAds === false) return false;
  }catch{}
  return true;
}

async function showBanner(){
  const bannerId = bannerAdId();
  if(!bannerId || !started) return;
  const isTesting = !import.meta.env.PROD && publicEnv('VITE_ADMOB_TESTING') === '1';
  await AdMob.showBanner({
    adId: bannerId,
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.TOP_CENTER,
    margin: 0,
    isTesting,
    npa: !getAdsTracking(),
  });
}

export async function initAds(){
  if(!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('is-native');

  if(!bannerAdId()) return;

  try{
    await AdMob.initialize();
    started = true;
    await requestTrackingIfNeeded();
    const canRequestAds = await requestUmpConsent();
    if(!canRequestAds) return;
    await showBanner();
  }catch(err){
    console.warn('[admob]', err);
  }
}

export async function refreshAds(){
  if(!Capacitor.isNativePlatform() || !started) return;
  try{ await AdMob.removeBanner(); }catch{}
  try{
    const canRequestAds = await requestUmpConsent();
    if(!canRequestAds) return;
    await showBanner();
  }catch(err){
    console.warn('[admob]', err);
  }
}

export async function openPrivacyOptions(){
  if(!Capacitor.isNativePlatform()) return;
  try{
    await AdMob.showPrivacyOptionsForm();
  }catch(err){
    console.warn('[admob]', err);
  }
}
