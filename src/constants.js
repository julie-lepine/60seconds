// HARDCORE : la 1re erreur de la partie retire 50 points, la 2e 100, la 3e 150… plafonné à 300.
// Le compteur d'erreurs ne se remet pas à zéro après une réussite.
export const HARDCORE_PENALTY_STEP = 50;
export const HARDCORE_PENALTY_CAP = 300;
export const CHALLENGE_TYPES = ['tap','math','timing','oddoneout','reaction','memory','greater','count','evenodd','leftright','goNoGo','sequence','direction','stroop'];
