import { applyReduceMotion, getUsername } from './storage.js';
import { renderHome } from './screens/home.js';
import { renderUsername } from './screens/username.js';

applyReduceMotion();

/* ===================== BOOT ===================== */
if(getUsername()) renderHome();
else renderUsername({ onDone: renderHome });
