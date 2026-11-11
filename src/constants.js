// HARDCORE : la 1re erreur de la partie retire 50 points, la 2e 100, la 3e 150… plafonné à 300.
// Le compteur d'erreurs ne se remet pas à zéro après une réussite.
export const HARDCORE_PENALTY_STEP = 50;

// Lien envoyé dans les messages de défi : la page du jeu (qui doit proposer les deux stores).
export const SHARE_URL = 'https://havefuncorp.fr/60-seconds';
// Pages des stores (modale « mise à jour disponible »).
export const STORE_URLS = Object.freeze({
  ios: 'https://apps.apple.com/fr/app/60-secondes/id6812448901',
  android: 'https://play.google.com/store/apps/details?id=com.hfc.sixtyseconds'
});
// Utilisée seulement si la version native est introuvable (le plugin @capacitor/app la fournit sur mobile).
export const FALLBACK_APP_VERSION = '1.1.1';
export const HARDCORE_PENALTY_CAP = 300;
export const CHALLENGE_TYPES = ['tap','math','timing','oddoneout','reaction','memory','greater','count','evenodd','leftright','goNoGo','sequence','direction','stroop'];
