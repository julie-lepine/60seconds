function achievement(id, category, title, description, condition, params = {}){
  return Object.freeze({
    id,
    category,
    title,
    description,
    condition,
    params: Object.freeze({ ...params })
  });
}

export const ACHIEVEMENT_CATEGORIES = Object.freeze({
  consistency: 'Assiduité',
  scores: 'Scores',
  mastery: 'Panache',
  experience: 'Au compteur',
  hardcore: 'Hardcore'
});

export const ACHIEVEMENTS = Object.freeze([
  achievement('streak_2', 'consistency', 'Départ lancé', 'Atteindre 2 jours de connexion consécutive.', 'streak', { days: 2 }),
  achievement('streak_7', 'consistency', 'En rythme', 'Atteindre 7 jours de connexion consécutive.', 'streak', { days: 7 }),
  achievement('streak_14', 'consistency', 'Rituel', 'Atteindre 14 jours de connexion consécutive.', 'streak', { days: 14 }),
  achievement('streak_30', 'consistency', 'Un mois chrono', 'Atteindre 30 jours de connexion consécutive.', 'streak', { days: 30 }),
  achievement('streak_60', 'consistency', '60 à la suite', 'Atteindre 60 jours de connexion consécutive.', 'streak', { days: 60 }),
  achievement('streak_100', 'consistency', '100 jours', 'Atteindre 100 jours de connexion consécutive.', 'streak', { days: 100 }),
  achievement('streak_365', 'consistency', 'À l’année', 'Atteindre 365 jours de connexion consécutive.', 'streak', { days: 365 }),
  achievement('return_after_7_days', 'consistency', 'Retour en piste', 'Rejouer après une interruption d’au moins 7 jours.', 'returnAfterBreak', { missedDays: 7 }),
  achievement('complete_weekend', 'consistency', 'Week-end complet', 'Jouer samedi et dimanche.', 'completeWeekend'),
  achievement('daily_7', 'consistency', 'Régulier', 'Terminer 7 défis quotidiens.', 'dailyCount', { count: 7 }),
  achievement('daily_30', 'consistency', 'Fidèle au poste', 'Terminer 30 défis quotidiens.', 'dailyCount', { count: 30 }),

  achievement('first_game', 'scores', 'Première seconde', 'Terminer sa première partie.', 'gamesCount', { count: 1 }),
  achievement('score_1000', 'scores', 'Échauffement', 'Atteindre 1 000 points.', 'score', { score: 1000 }),
  achievement('score_2500', 'scores', 'Plein régime', 'Atteindre 2 500 points.', 'score', { score: 2500 }),
  achievement('score_4000', 'scores', 'Sous tension', 'Atteindre 4 000 points.', 'score', { score: 4000 }),
  achievement('score_6000', 'scores', 'Surchauffe', 'Atteindre 6 000 points.', 'score', { score: 6000 }),
  achievement('score_8000', 'scores', 'Ça accélère', 'Atteindre 8 000 points.', 'score', { score: 8000 }),
  achievement('score_12000', 'scores', 'Hors limites', 'Atteindre 12 000 points.', 'score', { score: 12000 }),
  achievement('new_record', 'scores', 'Nouveau record', 'Battre son record.', 'recordsCount', { count: 1 }),
  achievement('records_5', 'scores', 'Record en série', 'Battre son record 5 fois.', 'recordsCount', { count: 5 }),

  achievement('no_error', 'mastery', 'Sans erreur', 'Terminer une partie sans erreur.', 'noError'),
  achievement('insane_5', 'mastery', 'Fulgurant', 'Obtenir 5 résultats « Furieux » dans une partie.', 'insaneCount', { count: 5 }),
  achievement('all_succeeded_v1', 'mastery', 'Tous terrains', 'Réussir chaque type de défi au moins une fois.', 'scopeSucceeded', { scopeId: 'challenge_scope_v1' }),
  achievement('timing_exact', 'mastery', 'Au centième', 'Réussir parfaitement le défi de timing.', 'timingExact'),

  achievement('games_10', 'experience', 'Habitué', 'Terminer 10 parties.', 'gamesCount', { count: 10 }),
  achievement('games_50', 'experience', 'Accro', 'Terminer 50 parties.', 'gamesCount', { count: 50 }),
  achievement('games_100', 'experience', 'Vétéran', 'Terminer 100 parties.', 'gamesCount', { count: 100 }),
  achievement('games_500', 'experience', 'Inarrêtable', 'Terminer 500 parties.', 'gamesCount', { count: 500 }),
  achievement('seconds_3600', 'experience', 'Une heure chrono', 'Cumuler 60 minutes de jeu.', 'secondsCount', { seconds: 3600 }),
  achievement('seconds_36000', 'experience', 'Marathon', 'Cumuler 10 heures de jeu.', 'secondsCount', { seconds: 36000 }),
  achievement('all_seen_v1', 'experience', 'Tout vu', 'Rencontrer tous les types de défis.', 'scopeSeen', { scopeId: 'challenge_scope_v1' }),
  achievement('hardcore_first_game', 'hardcore', 'Baptême du feu', 'Terminer sa première partie hardcore.', 'hardcoreGamesCount', { count: 1 }),
  achievement('hardcore_score_2000', 'hardcore', 'Sang-froid', 'Atteindre 2 000 points en hardcore.', 'hardcoreScore', { score: 2000 }),
  achievement('hardcore_score_4000', 'hardcore', 'Nerfs d’acier', 'Atteindre 4 000 points en hardcore.', 'hardcoreScore', { score: 4000 }),
  achievement('hardcore_score_6000', 'hardcore', 'Sans filet', 'Atteindre 6 000 points en hardcore.', 'hardcoreScore', { score: 6000 }),
  achievement('hardcore_records_3', 'hardcore', 'Record sous pression', 'Battre son record hardcore 3 fois.', 'hardcoreRecordsCount', { count: 3 }),
  achievement('hardcore_no_error', 'hardcore', 'Intouchable', 'Terminer une partie hardcore sans erreur.', 'hardcoreNoError'),
  achievement('hardcore_comeback', 'hardcore', 'Remontada', 'Tomber à 0 point, puis finir une partie hardcore avec au moins 1 500 points.', 'hardcoreComeback', { score: 1500 }),
  achievement('hardcore_no_mercy', 'hardcore', 'Pas de cadeau', 'Finir une partie hardcore à 2 000 points ou plus malgré au moins 5 erreurs.', 'hardcoreNoMercy', { score: 2000, errors: 5 }),
  achievement('hardcore_streak_10', 'hardcore', 'Série de 10', 'Enchaîner 10 réussites d’affilée en hardcore.', 'hardcoreSuccessStreak', { count: 10 }),
  achievement('hardcore_insane_8', 'hardcore', 'Foudroyant', 'Obtenir 8 résultats « Furieux » dans une partie hardcore.', 'hardcoreInsaneCount', { count: 8 }),
  achievement('hardcore_timing_exact', 'hardcore', 'Chirurgical', 'Réussir parfaitement le défi de timing en hardcore.', 'hardcoreTimingExact'),
  achievement('hardcore_all_succeeded_v1', 'hardcore', 'Sans faiblesse', 'Réussir chaque type de défi au moins une fois en hardcore.', 'hardcoreScopeSucceeded', { scopeId: 'challenge_scope_v1' })
]);

export const ACHIEVEMENTS_BY_ID = Object.freeze(
  Object.fromEntries(ACHIEVEMENTS.map(item => [item.id, item]))
);
