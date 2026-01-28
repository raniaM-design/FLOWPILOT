/**
 * Calcule la date d'échéance par défaut selon les préférences utilisateur
 * @param focusMode - Si true, retourne la date dans 3 jours, sinon null
 * @returns Date au format YYYY-MM-DD ou null
 */
export function getDefaultDueDate(focusMode: boolean): string | null {
  if (!focusMode) {
    return null;
  }

  // Date dans 3 jours
  const date = new Date();
  date.setDate(date.getDate() + 3);
  
  // Formater en YYYY-MM-DD pour l'input date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

