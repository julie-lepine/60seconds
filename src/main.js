import { applyDocumentLang } from './i18n.js';
import { applyReduceMotion, getUsername } from './storage.js';
import { initAds } from './ads.js';
import { renderHome } from './screens/home.js';
import { renderUsername } from './screens/username.js';

applyDocumentLang();
applyReduceMotion();
initAds();

/* ===================== BOOT ===================== */
if(getUsername()) renderHome();
else renderUsername({ onDone: renderHome });
