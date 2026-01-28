/**
 * Configuration centralisée du logo PILOTYS
 * 
 * RÈGLE D'OR : UN SEUL FICHIER SOURCE, UTILISÉ IDENTIQUEMENT PARTOUT
 * 
 * Ce fichier définit le chemin unique vers le logo officiel.
 * Tous les composants doivent utiliser cette constante.
 */

/**
 * Chemin unique vers le logo officiel PILOTYS
 * Ce fichier est la SEULE source autorisée pour le logo.
 */
export const LOGO_OFFICIAL_PATH = "/branding/logo-full.svg";

/**
 * Dimensions natives du logo officiel (ratio à toujours respecter)
 */
export const LOGO_OFFICIAL_DIMENSIONS = {
  width: 140,
  height: 32,
  ratio: 140 / 32, // 4.375
};

/**
 * Utilitaire pour obtenir les dimensions en respectant le ratio
 */
export function getLogoDimensions(height: number) {
  return {
    width: height * LOGO_OFFICIAL_DIMENSIONS.ratio,
    height: height,
  };
}

