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

/** Critères de mot de passe : min 8 car., majuscule, minuscule, chiffre, caractère spécial */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  hasLowercase: /[a-z]/,
  hasUppercase: /[A-Z]/,
  hasDigit: /[0-9]/,
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
} as const;

export type PasswordStrength = "weak" | "medium" | "strong";

export interface PasswordValidationResult {
  valid: boolean;
  strength: PasswordStrength;
  errors: string[];
  fulfilled: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Calcule la force du mot de passe (faible, moyen, fort)
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 6) return "weak";

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (PASSWORD_REQUIREMENTS.hasLowercase.test(password)) score++;
  if (PASSWORD_REQUIREMENTS.hasUppercase.test(password)) score++;
  if (PASSWORD_REQUIREMENTS.hasDigit.test(password)) score++;
  if (PASSWORD_REQUIREMENTS.hasSpecial.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}

/**
 * Valider un mot de passe avec critères complets
 */
export function isValidPassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const fulfilled = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasLowercase: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
    hasUppercase: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
    hasDigit: PASSWORD_REQUIREMENTS.hasDigit.test(password),
    hasSpecial: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
  };

  if (!fulfilled.minLength) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push("Le mot de passe est trop long (maximum 128 caractères)");
  }
  if (!fulfilled.hasLowercase) {
    errors.push("Le mot de passe doit contenir au moins une minuscule (a-z)");
  }
  if (!fulfilled.hasUppercase) {
    errors.push("Le mot de passe doit contenir au moins une majuscule (A-Z)");
  }
  if (!fulfilled.hasDigit) {
    errors.push("Le mot de passe doit contenir au moins un chiffre (0-9)");
  }
  if (!fulfilled.hasSpecial) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial (!@#$%...)");
  }

  return {
    valid: errors.length === 0,
    strength: getPasswordStrength(password),
    errors,
    fulfilled,
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

