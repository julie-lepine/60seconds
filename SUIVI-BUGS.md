# Suivi de bugs — 60 SECONDS

Audit du **17 septembre 2026**.  
Statuts : `ouvert` · `corrigé` · `wontfix`

| | Ouverts | Corrigés | Wontfix |
|---|---|---|---|
| P0 | 0 | 4 | 0 |
| P1 | 0 | 8 | 0 |
| P2 | 0 | 8 | 6 |
| P3 | 0 | 9 | 1 |

Plus aucun ticket ouvert.

---

## Clos

**Corrigés**

- **BUG-001** `endGame()` doublon (timeout flash + garde écran)
- **BUG-002** double score sans verrou → `flashLock` dans `resultFlash`
- **BUG-003** timers de défi non clear → `clearChallengeTimers` (sans tuer le RAF)
- **BUG-004** double tap Jouer → ignore si déjà countdown / gameplay
- **BUG-005** insert classement sans plafond → SQL `score <= 50000` (`003_leaderboard_score_cap.sql`, à jouer sur Supabase)
- **BUG-006** GÉNÉRAL mixte + ligne 51 / coral ; RECORD accueil = classique
- **BUG-007** daily en UTC (séquence + lock + board)
- **BUG-008** picker daily infini, anti-répétition
- **BUG-009** `VITE_ADMOB_BANNER_ID_ANDROID` dans `.env.production`
- **BUG-010** ATT redemandée dans `refreshAds`
- **BUG-011** icônes Android `mipmap-*` déjà présentes (faux positif audit)
- **BUG-012** portrait only (Android + iOS/iPad)
- **BUG-013** son persisté
- **BUG-014** `AudioContext.resume()`
- **BUG-016** countdown : garde si `el` absent
- **BUG-017** pas de points hors `gameplay`
- **BUG-020** pseudo `maxlength=16` + submit `disabled`
- **BUG-022** `100dvh` + `safe-area-inset-bottom`
- **BUG-024** Inter / Archivo embarquées (`src/fonts/`, plus d’appel Google)
- **BUG-026** versions alignées sur **1.0.5**
- **BUG-027** DE `AUSREISSER`
- **BUG-028** ES nav/titre `CLASIFICACIÓN`
- **BUG-029** tests Android `com.hfc.sixtyseconds`
- **BUG-030** param mort `cb` retiré
- **BUG-031** `G.tapTimer` retiré
- **BUG-032** `parseInt(..., 10)`
- **BUG-033** `allowBackup=false`
- **BUG-035** `.env.production` gitignoré (fichier local à conserver)
- **BUG-036** daily : pas de bouton Rejouer

**Wontfix**

- **BUG-015** chrono continue en background (décision)
- **BUG-018** onglet scores = dernier mode joué (décision)
- **BUG-019** lock daily local seulement — sans compte, un lock serveur au pseudo se contourne pareil
- **BUG-021** « refuser » = pas de suivi pub / pubs non perso ; les pubs restent (décision)
- **BUG-023** bandeau pub web (web non pérenne)
- **BUG-025** pas de sélecteur de langue, suit l’OS (décision)
- **BUG-034** un id SKAdNetwork Google suffit (AdMob direct, pas de médiation)
