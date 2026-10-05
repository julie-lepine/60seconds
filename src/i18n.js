export const SUPPORTED_LANGUAGES = Object.freeze(['fr', 'en', 'es', 'de']);
const SUPPORTED = SUPPORTED_LANGUAGES;

const STRINGS = {
  fr: {
    ad: 'Publicité',
    navScores: 'SCORES',
    navSettings: 'RÉGLAGES',
    seconds: 'SECONDES',
    play: 'JOUER',
    daily: 'DÉFI DU JOUR',
    dailyDone: 'DÉFI TERMINÉ',
    record: 'RECORD',
    streak: 'SÉRIE',
    streakDay: '{count} JOUR',
    streakDays: '{count} JOURS',
    chooseUsername: 'CHOISIS TON PSEUDO',
    continue: 'CONTINUER',
    back: 'RETOUR',
    home: 'ACCUEIL',
    settings: 'RÉGLAGES',
    username: 'PSEUDO',
    edit: 'MODIFIER',
    sound: 'SON',
    reduceMotion: 'RÉDUIRE LES ANIMATIONS',
    about: 'À PROPOS',
    aboutValue: '60 SECONDES · v1.0.6',
    save: 'ENREGISTRER',
    scores: 'SCORES',
    tabGeneral: 'GÉNÉRAL',
    tabDaily: 'DU JOUR',
    noScores: 'AUCUN SCORE',
    loading: 'CHARGEMENT',
    leaderboardUnavailable: 'CLASSEMENT INDISPONIBLE',
    score: 'SCORE',
    newRecord: 'NOUVEAU RECORD',
    vsRecord: '{delta} VS TON RECORD',
    firstScore: 'PREMIER SCORE',
    playAgain: 'REJOUER',
    title: '60 SECONDES',
    go: 'GO',
    tap: 'TAPOTE',
    math: 'CALCUL',
    tapAt: 'TAPE À {target}',
    stop: 'ARRÊTE',
    oddoneout: "TROUVE L'INTRUS",
    wait: 'ATTENDS',
    now: 'MAINTENANT',
    remember: 'RETIENS',
    repeat: 'RÉPÈTE',
    greater: 'PLUS GRAND',
    count: 'COMBIEN',
    evenOdd: 'PAIR OU IMPAIR',
    even: 'PAIR',
    odd: 'IMPAIR',
    leftRight: 'GAUCHE DROITE',
    left: 'GAUCHE',
    right: 'DROITE',
    tapGo: 'TAPE',
    dontTouch: 'N’Y TOUCHE PAS',
    sequence: 'LA SUITE',
    direction: 'SENS',
    color: 'COULEUR',
    inkBlack: 'NOIR',
    inkCream: 'CRÈME',
    inkCoral: 'CORAIL',
    flashInsane: 'FURIEUX',
    flashGood: 'PARFAIT',
    flashBad: 'RATÉ',
    consentTitle: 'DONNÉES',
    consentLeaderboard: 'Pour le classement, ton pseudo et tes scores sont envoyés sur nos serveurs.',
    consentAds: 'Pour les publicités, Google AdMob peut utiliser l’identifiant publicitaire, une localisation approximative (via l’adresse IP) et tes interactions dans l’app, afin d’afficher des pubs, mesurer leur performance et limiter la fraude.',
    consentChoice: 'Le suivi publicitaire est facultatif. Tu peux le refuser ici, ou le modifier plus tard dans les réglages.',
    consentAccept: 'ACCEPTER',
    consentDecline: 'CONTINUER SANS SUIVI PUB',
    adsTracking: 'SUIVI PUBLICITAIRE',
    privacy: 'CONFIDENTIALITÉ',
    privacyView: 'VOIR',
    privacyManage: 'CHOIX PUBLICITAIRES',
    privacyManageAction: 'GÉRER'
  },
  en: {
    ad: 'Advertisement',
    navScores: 'SCORES',
    navSettings: 'SETTINGS',
    seconds: 'SECONDS',
    play: 'PLAY',
    daily: 'DAILY CHALLENGE',
    dailyDone: 'CHALLENGE COMPLETE',
    record: 'RECORD',
    streak: 'STREAK',
    streakDay: '{count} DAY',
    streakDays: '{count} DAYS',
    chooseUsername: 'CHOOSE YOUR NAME',
    continue: 'CONTINUE',
    back: 'BACK',
    home: 'HOME',
    settings: 'SETTINGS',
    username: 'NAME',
    edit: 'EDIT',
    sound: 'SOUND',
    reduceMotion: 'REDUCE MOTION',
    about: 'ABOUT',
    aboutValue: '60 SECONDS · v1.0.6',
    save: 'SAVE',
    scores: 'SCORES',
    tabGeneral: 'OVERALL',
    tabDaily: 'DAILY',
    noScores: 'NO SCORES',
    loading: 'LOADING',
    leaderboardUnavailable: 'LEADERBOARD UNAVAILABLE',
    score: 'SCORE',
    newRecord: 'NEW RECORD',
    vsRecord: '{delta} VS YOUR RECORD',
    firstScore: 'FIRST SCORE',
    playAgain: 'PLAY AGAIN',
    title: '60 SECONDS',
    go: 'GO',
    tap: 'TAP',
    math: 'MATH',
    tapAt: 'TAP AT {target}',
    stop: 'STOP',
    oddoneout: 'FIND THE ODD ONE',
    wait: 'WAIT',
    now: 'NOW',
    remember: 'REMEMBER',
    repeat: 'REPEAT',
    greater: 'GREATER',
    count: 'HOW MANY',
    evenOdd: 'EVEN OR ODD',
    even: 'EVEN',
    odd: 'ODD',
    leftRight: 'LEFT RIGHT',
    left: 'LEFT',
    right: 'RIGHT',
    tapGo: 'TAP',
    dontTouch: "DON'T TOUCH",
    sequence: 'THE SEQUENCE',
    direction: 'DIRECTION',
    color: 'COLOR',
    inkBlack: 'BLACK',
    inkCream: 'CREAM',
    inkCoral: 'CORAL',
    flashInsane: 'INSANE',
    flashGood: 'PERFECT',
    flashBad: 'MISS',
    consentTitle: 'DATA',
    consentLeaderboard: 'For the leaderboard, your name and scores are sent to our servers.',
    consentAds: 'For ads, Google AdMob may use the advertising ID, approximate location (from IP address), and in-app interactions to show ads, measure performance, and prevent fraud.',
    consentChoice: 'Ad tracking is optional. You can turn it off here, or change it later in Settings.',
    consentAccept: 'ACCEPT',
    consentDecline: 'CONTINUE WITHOUT AD TRACKING',
    adsTracking: 'AD TRACKING',
    privacy: 'PRIVACY',
    privacyView: 'VIEW',
    privacyManage: 'AD CHOICES',
    privacyManageAction: 'MANAGE'
  },
  es: {
    ad: 'Publicidad',
    navScores: 'CLASIFICACIÓN',
    navSettings: 'AJUSTES',
    seconds: 'SEGUNDOS',
    play: 'JUGAR',
    daily: 'RETO DIARIO',
    dailyDone: 'RETO COMPLETADO',
    record: 'RÉCORD',
    streak: 'RACHA',
    streakDay: '{count} DÍA',
    streakDays: '{count} DÍAS',
    chooseUsername: 'ELIGE TU APODO',
    continue: 'CONTINUAR',
    back: 'ATRÁS',
    home: 'INICIO',
    settings: 'AJUSTES',
    username: 'APODO',
    edit: 'EDITAR',
    sound: 'SONIDO',
    reduceMotion: 'REDUCIR ANIMACIONES',
    about: 'ACERCA DE',
    aboutValue: '60 SEGUNDOS · v1.0.6',
    save: 'GUARDAR',
    scores: 'CLASIFICACIÓN',
    tabGeneral: 'GENERAL',
    tabDaily: 'DEL DÍA',
    noScores: 'SIN PUNTOS',
    loading: 'CARGANDO',
    leaderboardUnavailable: 'CLASIFICACIÓN NO DISPONIBLE',
    score: 'PUNTUACIÓN',
    newRecord: 'NUEVO RÉCORD',
    vsRecord: '{delta} VS TU RÉCORD',
    firstScore: 'PRIMERA PUNTUACIÓN',
    playAgain: 'OTRA VEZ',
    title: '60 SEGUNDOS',
    go: 'YA',
    tap: 'TOCA',
    math: 'CÁLCULO',
    tapAt: 'TOCA A {target}',
    stop: 'PARA',
    oddoneout: 'ENCUENTRA AL INTRUSO',
    wait: 'ESPERA',
    now: 'AHORA',
    remember: 'MEMORIZA',
    repeat: 'REPITE',
    greater: 'MAYOR',
    count: 'CUÁNTOS',
    evenOdd: 'PAR O IMPAR',
    even: 'PAR',
    odd: 'IMPAR',
    leftRight: 'IZQUIERDA DERECHA',
    left: 'IZQUIERDA',
    right: 'DERECHA',
    tapGo: 'TOCA',
    dontTouch: 'NO TOQUES',
    sequence: 'LA SERIE',
    direction: 'DIRECCIÓN',
    color: 'COLOR',
    inkBlack: 'NEGRO',
    inkCream: 'CREMA',
    inkCoral: 'CORAL',
    flashInsane: 'FURIOSO',
    flashGood: 'PERFECTO',
    flashBad: 'FALLO',
    consentTitle: 'DATOS',
    consentLeaderboard: 'Para la clasificación, tu apodo y tus puntos se envían a nuestros servidores.',
    consentAds: 'Para los anuncios, Google AdMob puede usar el identificador publicitario, una ubicación aproximada (a través de la IP) y tus interacciones en la app, para mostrar anuncios, medir su rendimiento y limitar el fraude.',
    consentChoice: 'El seguimiento publicitario es opcional. Puedes rechazarlo aquí o cambiarlo más tarde en Ajustes.',
    consentAccept: 'ACEPTAR',
    consentDecline: 'CONTINUAR SIN SEGUIMIENTO',
    adsTracking: 'SEGUIMIENTO PUBLICITARIO',
    privacy: 'PRIVACIDAD',
    privacyView: 'VER',
    privacyManage: 'OPCIONES DE ANUNCIOS',
    privacyManageAction: 'GESTIONAR'
  },
  de: {
    ad: 'Werbung',
    navScores: 'PUNKTE',
    navSettings: 'OPTIONEN',
    seconds: 'SEKUNDEN',
    play: 'SPIELEN',
    daily: 'TAGESAUFGABE',
    dailyDone: 'AUFGABE ERLEDIGT',
    record: 'REKORD',
    streak: 'SERIE',
    streakDay: '{count} TAG',
    streakDays: '{count} TAGE',
    chooseUsername: 'WÄHLE DEINEN NAMEN',
    continue: 'WEITER',
    back: 'ZURÜCK',
    home: 'START',
    settings: 'OPTIONEN',
    username: 'NAME',
    edit: 'ÄNDERN',
    sound: 'TON',
    reduceMotion: 'ANIMATIONEN REDUZIEREN',
    about: 'INFO',
    aboutValue: '60 SEKUNDEN · v1.0.6',
    save: 'SPEICHERN',
    scores: 'PUNKTE',
    tabGeneral: 'GESAMT',
    tabDaily: 'HEUTE',
    noScores: 'KEINE PUNKTE',
    loading: 'LADEN',
    leaderboardUnavailable: 'RANGLISTE NICHT VERFÜGBAR',
    score: 'PUNKTZAHL',
    newRecord: 'NEUER REKORD',
    vsRecord: '{delta} GEGEN DEINEN REKORD',
    firstScore: 'ERSTE PUNKTZAHL',
    playAgain: 'NOCHMAL',
    title: '60 SEKUNDEN',
    go: 'LOS',
    tap: 'TIPPE',
    math: 'RECHNEN',
    tapAt: 'TIPPE BEI {target}',
    stop: 'STOPP',
    oddoneout: 'DER AUSREISSER',
    wait: 'WARTE',
    now: 'JETZT',
    remember: 'MERKE',
    repeat: 'WIEDERHOLE',
    greater: 'GRÖSSER',
    count: 'WIE VIELE',
    evenOdd: 'GERADE / UNGERADE',
    even: 'GERADE',
    odd: 'UNGERADE',
    leftRight: 'LINKS RECHTS',
    left: 'LINKS',
    right: 'RECHTS',
    tapGo: 'TIPPE',
    dontTouch: 'NICHT BERÜHREN',
    sequence: 'DIE FOLGE',
    direction: 'RICHTUNG',
    color: 'FARBE',
    inkBlack: 'SCHWARZ',
    inkCream: 'CREME',
    inkCoral: 'KORALLE',
    flashInsane: 'WAHNSINN',
    flashGood: 'PERFEKT',
    flashBad: 'DANEBEN',
    consentTitle: 'DATEN',
    consentLeaderboard: 'Für die Rangliste werden dein Name und deine Punkte an unsere Server gesendet.',
    consentAds: 'Für Werbung kann Google AdMob die Werbe-ID, ungefähren Standort (über die IP-Adresse) und App-Interaktionen nutzen, um Anzeigen zu zeigen, ihre Leistung zu messen und Betrug zu begrenzen.',
    consentChoice: 'Das Werbe-Tracking ist optional. Du kannst es hier ablehnen oder später in den Optionen ändern.',
    consentAccept: 'AKZEPTIEREN',
    consentDecline: 'OHNE TRACKING FORTFAHREN',
    adsTracking: 'WERBE-TRACKING',
    privacy: 'DATENSCHUTZ',
    privacyView: 'ANSEHEN',
    privacyManage: 'WERBEOPTIONEN',
    privacyManageAction: 'VERWALTEN'
  }
};

const ACHIEVEMENT_UI_STRINGS = {
  fr: {
    achievements: 'SUCCÈS',
    achievementLocked: 'VERROUILLÉ',
    achievementUnlockedOn: 'DÉBLOQUÉ LE {date}',
    achievementUnlocked: 'SUCCÈS DÉBLOQUÉ',
    achievementsUnlocked: 'SUCCÈS DÉBLOQUÉS',
    otherAchievements: '+ {count} AUTRES',
    achievementCategoryConsistency: 'ASSIDUITÉ',
    achievementCategoryScores: 'SCORES',
    achievementCategoryMastery: 'PANACHE',
    achievementCategoryExperience: 'AU COMPTEUR'
  },
  en: {
    achievements: 'ACHIEVEMENTS',
    achievementLocked: 'LOCKED',
    achievementUnlockedOn: 'UNLOCKED {date}',
    achievementUnlocked: 'ACHIEVEMENT UNLOCKED',
    achievementsUnlocked: 'ACHIEVEMENTS UNLOCKED',
    otherAchievements: '+ {count} MORE',
    achievementCategoryConsistency: 'CONSISTENCY',
    achievementCategoryScores: 'SCORES',
    achievementCategoryMastery: 'FLAIR',
    achievementCategoryExperience: 'MILEAGE'
  },
  es: {
    achievements: 'LOGROS',
    achievementLocked: 'BLOQUEADO',
    achievementUnlockedOn: 'DESBLOQUEADO EL {date}',
    achievementUnlocked: 'LOGRO DESBLOQUEADO',
    achievementsUnlocked: 'LOGROS DESBLOQUEADOS',
    otherAchievements: '+ {count} MÁS',
    achievementCategoryConsistency: 'CONSTANCIA',
    achievementCategoryScores: 'PUNTUACIONES',
    achievementCategoryMastery: 'BRÍO',
    achievementCategoryExperience: 'KILÓMETROS'
  },
  de: {
    achievements: 'ERFOLGE',
    achievementLocked: 'GESPERRT',
    achievementUnlockedOn: 'FREIGESCHALTET AM {date}',
    achievementUnlocked: 'ERFOLG FREIGESCHALTET',
    achievementsUnlocked: 'ERFOLGE FREIGESCHALTET',
    otherAchievements: '+ {count} WEITERE',
    achievementCategoryConsistency: 'AUSDAUER',
    achievementCategoryScores: 'PUNKTE',
    achievementCategoryMastery: 'SCHWUNG',
    achievementCategoryExperience: 'KILOMETERSTAND'
  }
};

const ACHIEVEMENT_COPY = {
  fr: {
    streak_2: ['Départ lancé', 'Atteindre 2 jours de connexion consécutive.'],
    streak_7: ['En rythme', 'Atteindre 7 jours de connexion consécutive.'],
    streak_14: ['Rituel', 'Atteindre 14 jours de connexion consécutive.'],
    streak_30: ['Un mois chrono', 'Atteindre 30 jours de connexion consécutive.'],
    streak_60: ['60 à la suite', 'Atteindre 60 jours de connexion consécutive.'],
    streak_100: ['100 jours', 'Atteindre 100 jours de connexion consécutive.'],
    streak_365: ['À l’année', 'Atteindre 365 jours de connexion consécutive.'],
    return_after_7_days: ['Retour en piste', 'Rejouer après une interruption d’au moins 7 jours.'],
    complete_weekend: ['Week-end complet', 'Jouer samedi et dimanche.'],
    daily_7: ['Régulier', 'Terminer 7 défis quotidiens.'],
    daily_30: ['Fidèle au poste', 'Terminer 30 défis quotidiens.'],
    first_game: ['Première seconde', 'Terminer sa première partie.'],
    score_1000: ['Échauffement', 'Atteindre 1 000 points.'],
    score_2500: ['Plein régime', 'Atteindre 2 500 points.'],
    score_4000: ['Sous tension', 'Atteindre 4 000 points.'],
    score_6000: ['Surchauffe', 'Atteindre 6 000 points.'],
    score_8000: ['Ça accélère', 'Atteindre 8 000 points.'],
    score_12000: ['Hors limites', 'Atteindre 12 000 points.'],
    new_record: ['Nouveau record', 'Battre son record.'],
    records_5: ['Record en série', 'Battre son record 5 fois.'],
    no_error: ['Sans erreur', 'Terminer une partie sans erreur.'],
    insane_5: ['Fulgurant', 'Obtenir 5 résultats « Furieux » dans une partie.'],
    all_succeeded_v1: ['Tous terrains', 'Réussir chaque type de défi au moins une fois.'],
    timing_exact: ['Au centième', 'Réussir parfaitement le défi de timing.'],
    games_10: ['Habitué', 'Terminer 10 parties.'],
    games_50: ['Accro', 'Terminer 50 parties.'],
    games_100: ['Vétéran', 'Terminer 100 parties.'],
    games_500: ['Inarrêtable', 'Terminer 500 parties.'],
    seconds_3600: ['Une heure chrono', 'Cumuler 60 minutes de jeu.'],
    seconds_36000: ['Marathon', 'Cumuler 10 heures de jeu.'],
    all_seen_v1: ['Tout vu', 'Rencontrer tous les types de défis.']
  },
  en: {
    streak_2: ['Off to a start', 'Reach a 2-day streak.'],
    streak_7: ['In the groove', 'Reach a 7-day streak.'],
    streak_14: ['Ritual', 'Reach a 14-day streak.'],
    streak_30: ['A month on the clock', 'Reach a 30-day streak.'],
    streak_60: ['60 straight', 'Reach a 60-day streak.'],
    streak_100: ['100 days', 'Reach a 100-day streak.'],
    streak_365: ['A full year', 'Reach a 365-day streak.'],
    return_after_7_days: ['Back in the game', 'Play again after a break of at least 7 days.'],
    complete_weekend: ['Full weekend', 'Play on Saturday and Sunday.'],
    daily_7: ['Regular', 'Complete 7 daily challenges.'],
    daily_30: ['Always there', 'Complete 30 daily challenges.'],
    first_game: ['First second', 'Finish your first game.'],
    score_1000: ['Warm-up', 'Reach 1,000 points.'],
    score_2500: ['Full speed', 'Reach 2,500 points.'],
    score_4000: ['Under pressure', 'Reach 4,000 points.'],
    score_6000: ['Overheating', 'Reach 6,000 points.'],
    score_8000: ['Picking up speed', 'Reach 8,000 points.'],
    score_12000: ['Beyond limits', 'Reach 12,000 points.'],
    new_record: ['New record', 'Beat your record.'],
    records_5: ['Record run', 'Beat your record 5 times.'],
    no_error: ['Flawless', 'Finish a game without an error.'],
    insane_5: ['Lightning fast', 'Get 5 “Insane” results in one game.'],
    all_succeeded_v1: ['All-rounder', 'Succeed at every challenge type at least once.'],
    timing_exact: ['To the hundredth', 'Complete the timing challenge perfectly.'],
    games_10: ['Regular player', 'Finish 10 games.'],
    games_50: ['Hooked', 'Finish 50 games.'],
    games_100: ['Veteran', 'Finish 100 games.'],
    games_500: ['Unstoppable', 'Finish 500 games.'],
    seconds_3600: ['One hour on the clock', 'Accumulate 60 minutes of play.'],
    seconds_36000: ['Marathon', 'Accumulate 10 hours of play.'],
    all_seen_v1: ['Seen it all', 'Encounter every challenge type.']
  },
  es: {
    streak_2: ['Buen comienzo', 'Alcanza una racha de 2 días.'],
    streak_7: ['En ritmo', 'Alcanza una racha de 7 días.'],
    streak_14: ['Ritual', 'Alcanza una racha de 14 días.'],
    streak_30: ['Un mes al reloj', 'Alcanza una racha de 30 días.'],
    streak_60: ['60 seguidos', 'Alcanza una racha de 60 días.'],
    streak_100: ['100 días', 'Alcanza una racha de 100 días.'],
    streak_365: ['Un año entero', 'Alcanza una racha de 365 días.'],
    return_after_7_days: ['De vuelta', 'Vuelve a jugar tras una pausa de al menos 7 días.'],
    complete_weekend: ['Fin de semana completo', 'Juega el sábado y el domingo.'],
    daily_7: ['Constante', 'Completa 7 retos diarios.'],
    daily_30: ['Siempre presente', 'Completa 30 retos diarios.'],
    first_game: ['Primer segundo', 'Termina tu primera partida.'],
    score_1000: ['Calentamiento', 'Alcanza 1.000 puntos.'],
    score_2500: ['A toda máquina', 'Alcanza 2.500 puntos.'],
    score_4000: ['Bajo presión', 'Alcanza 4.000 puntos.'],
    score_6000: ['Al rojo', 'Alcanza 6.000 puntos.'],
    score_8000: ['Acelerando', 'Alcanza 8.000 puntos.'],
    score_12000: ['Sin límites', 'Alcanza 12.000 puntos.'],
    new_record: ['Nuevo récord', 'Supera tu récord.'],
    records_5: ['Serie de récords', 'Supera tu récord 5 veces.'],
    no_error: ['Sin errores', 'Termina una partida sin errores.'],
    insane_5: ['Fulminante', 'Consigue 5 resultados «Furioso» en una partida.'],
    all_succeeded_v1: ['Todoterreno', 'Supera cada tipo de reto al menos una vez.'],
    timing_exact: ['A la centésima', 'Completa perfectamente el reto de tiempo.'],
    games_10: ['Habitual', 'Termina 10 partidas.'],
    games_50: ['Enganchado', 'Termina 50 partidas.'],
    games_100: ['Veterano', 'Termina 100 partidas.'],
    games_500: ['Imparable', 'Termina 500 partidas.'],
    seconds_3600: ['Una hora al reloj', 'Acumula 60 minutos de juego.'],
    seconds_36000: ['Maratón', 'Acumula 10 horas de juego.'],
    all_seen_v1: ['Todo visto', 'Encuentra todos los tipos de reto.']
  },
  de: {
    streak_2: ['Guter Start', 'Erreiche eine Serie von 2 Tagen.'],
    streak_7: ['Im Rhythmus', 'Erreiche eine Serie von 7 Tagen.'],
    streak_14: ['Ritual', 'Erreiche eine Serie von 14 Tagen.'],
    streak_30: ['Ein Monat auf der Uhr', 'Erreiche eine Serie von 30 Tagen.'],
    streak_60: ['60 am Stück', 'Erreiche eine Serie von 60 Tagen.'],
    streak_100: ['100 Tage', 'Erreiche eine Serie von 100 Tagen.'],
    streak_365: ['Ein ganzes Jahr', 'Erreiche eine Serie von 365 Tagen.'],
    return_after_7_days: ['Zurück im Spiel', 'Spiele nach mindestens 7 Tagen Pause erneut.'],
    complete_weekend: ['Ganzes Wochenende', 'Spiele am Samstag und am Sonntag.'],
    daily_7: ['Beständig', 'Schließe 7 Tagesaufgaben ab.'],
    daily_30: ['Immer dabei', 'Schließe 30 Tagesaufgaben ab.'],
    first_game: ['Erste Sekunde', 'Beende dein erstes Spiel.'],
    score_1000: ['Aufwärmen', 'Erreiche 1.000 Punkte.'],
    score_2500: ['Volle Fahrt', 'Erreiche 2.500 Punkte.'],
    score_4000: ['Unter Druck', 'Erreiche 4.000 Punkte.'],
    score_6000: ['Überhitzt', 'Erreiche 6.000 Punkte.'],
    score_8000: ['Es wird schneller', 'Erreiche 8.000 Punkte.'],
    score_12000: ['Grenzenlos', 'Erreiche 12.000 Punkte.'],
    new_record: ['Neuer Rekord', 'Überbiete deinen Rekord.'],
    records_5: ['Rekordserie', 'Überbiete deinen Rekord 5-mal.'],
    no_error: ['Fehlerfrei', 'Beende ein Spiel ohne Fehler.'],
    insane_5: ['Blitzschnell', 'Erziele 5 „Wahnsinn“-Ergebnisse in einem Spiel.'],
    all_succeeded_v1: ['Alleskönner', 'Schaffe jeden Aufgabentyp mindestens einmal.'],
    timing_exact: ['Auf die Hundertstel', 'Schließe die Zeitaufgabe perfekt ab.'],
    games_10: ['Stammspieler', 'Beende 10 Spiele.'],
    games_50: ['Gefesselt', 'Beende 50 Spiele.'],
    games_100: ['Veteran', 'Beende 100 Spiele.'],
    games_500: ['Unaufhaltsam', 'Beende 500 Spiele.'],
    seconds_3600: ['Eine Stunde auf der Uhr', 'Sammle 60 Minuten Spielzeit.'],
    seconds_36000: ['Marathon', 'Sammle 10 Stunden Spielzeit.'],
    all_seen_v1: ['Alles gesehen', 'Begegne allen Aufgabentypen.']
  }
};

export const ACHIEVEMENT_TRANSLATION_KEYS = Object.freeze(
  Object.keys(ACHIEVEMENT_COPY.fr).flatMap(id => [
    `achievement.${id}.title`,
    `achievement.${id}.description`
  ])
);

for(const language of SUPPORTED){
  Object.assign(STRINGS[language], ACHIEVEMENT_UI_STRINGS[language]);
  for(const [id, [title, description]] of Object.entries(ACHIEVEMENT_COPY[language])){
    STRINGS[language][`achievement.${id}.title`] = title;
    STRINGS[language][`achievement.${id}.description`] = description;
  }
}

const LANG_KEY = '60seconds_lang';

function normalizeLang(raw){
  const code = String(raw || '').slice(0, 2).toLowerCase();
  return SUPPORTED.includes(code) ? code : '';
}

function readLangOverride(){
  try{
    return normalizeLang(localStorage.getItem(LANG_KEY));
  }catch{
    return '';
  }
}

function spoofBrowserLang(code){
  const tag = ({ en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR' })[code] || `${code}-${code.toUpperCase()}`;
  try{
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => tag });
    Object.defineProperty(navigator, 'languages', { configurable: true, get: () => [tag, code] });
    Object.defineProperty(navigator, 'userLanguage', { configurable: true, get: () => tag });
  }catch{}
}

function detectLang(){
  const override = readLangOverride();
  if(override){
    spoofBrowserLang(override);
    return override;
  }
  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
    navigator.userLanguage
  ].filter(Boolean);
  try{ candidates.push(Intl.DateTimeFormat().resolvedOptions().locale); }catch{}
  for(const raw of candidates){
    const code = normalizeLang(raw);
    if(code) return code;
  }
  return 'fr';
}

export const lang = detectLang();

export function translateForLanguage(language, key, vars){
  const dict = STRINGS[language] || STRINGS.fr;
  let s = dict[key] ?? STRINGS.fr[key] ?? key;
  if(vars){
    s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
  }
  return s;
}

export function hasTranslation(language, key){
  return Object.prototype.hasOwnProperty.call(STRINGS[language] || {}, key);
}

export function t(key, vars){
  return translateForLanguage(lang, key, vars);
}

export function inkColors(){
  return [
    { id: 'black', word: t('inkBlack') },
    { id: 'cream', word: t('inkCream') },
    { id: 'coral', word: t('inkCoral') }
  ];
}

export function applyDocumentLang(){
  document.documentElement.lang = lang;
  const banner = document.querySelector('.ad-banner');
  if(banner) banner.setAttribute('aria-label', t('ad'));
  const placeholder = document.querySelector('.ad-placeholder');
  if(placeholder) placeholder.textContent = t('ad');
}
