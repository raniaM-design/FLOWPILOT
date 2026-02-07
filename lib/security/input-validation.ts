/**
 * Validation et sanitization des entrées utilisateur
 */

/**
 * Sanitizer pour les chaînes de caractères
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Supprimer les balises HTML
    .replace(/javascript:/gi, "") // Supprimer les protocoles javascript
    .replace(/on\w+=/gi, ""); // Supprimer les event handlers
}

/**
 * Valider un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valider un mot de passe
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }
  
  if (password.length > 128) {
    errors.push("Le mot de passe est trop long (maximum 128 caractères)");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valider un ID (UUID ou autre)
 */
export function isValidId(id: string | null | undefined): boolean {
  if (!id) return false;
  
  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(id) && id.length <= 36;
}

/**
 * Valider une URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Échapper les caractères HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Valider et nettoyer les paramètres de requête
 */
export function sanitizeQueryParams(params: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  params.forEach((value, key) => {
    // Limiter la longueur des paramètres
    if (key.length > 100 || value.length > 1000) {
      return; // Ignorer les paramètres trop longs
    }
    
    sanitized[sanitizeString(key)] = sanitizeString(value);
  });
  
  return sanitized;
}

