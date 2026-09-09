import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';

function publicEnv(name){
  try{
    const v = import.meta.env?.[name];
    if(v) return String(v).trim();
  }catch{}
  return '';
}

export async function initAds(){
  if(!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('is-native');

  const bannerId = publicEnv('VITE_ADMOB_BANNER_ID');
  if(!bannerId) return;

  const isTesting = publicEnv('VITE_ADMOB_TESTING') === '1';

  try{
    await AdMob.initialize();
    try{
      let consent = await AdMob.requestConsentInfo();
      if(consent?.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED){
        consent = await AdMob.showConsentForm();
      }
      if(consent && consent.canRequestAds === false) return;
    }catch{}

    await AdMob.showBanner({
      adId: bannerId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.TOP_CENTER,
      margin: 0,
      isTesting,
    });
  }catch(err){
    console.warn('[admob]', err);
  }
}
