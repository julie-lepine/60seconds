// Série : palier visuel de la flamme et badge du classement. Fonctions pures.

// Mêmes seuils que les succès de régularité (2, 7, 14, 30, 60, 100 jours).
const TIERS = [100, 60, 30, 14, 7, 2];

// 0 = pas de série ou 1 jour, puis 1 à 6 aux paliers 2 / 7 / 14 / 30 / 60 / 100.
export function streakTier(count){
  const n = Number(count);
  if(!Number.isFinite(n) || n < 2) return 0;
  const index = TIERS.findIndex(min => n >= min);
  return TIERS.length - index;
}

export function flameHtml(count){
  return `<span class="streak-flame t${streakTier(count)}" aria-hidden="true"></span>`;
}

// Badge de classement : visible dès le palier de 7 jours.
export const BADGE_MIN_STREAK = 7;
export function badgeHtml(streak){
  const n = Math.floor(Number(streak));
  if(!Number.isFinite(n) || n < BADGE_MIN_STREAK) return '';
  return `<span class="streak-badge" aria-label="${n}">${flameHtml(n)}<span>${n}</span></span>`;
}

export const snowflakeSvg = '<svg class="freeze-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/></svg>';
