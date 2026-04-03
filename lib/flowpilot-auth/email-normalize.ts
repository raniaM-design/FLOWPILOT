/**
 * Normalise l’email pour comparaison et stockage (domaine insensible à la casse ;
 * local-part traité en minuscules — comportement usuel Gmail / Outlook / Hotmail).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
