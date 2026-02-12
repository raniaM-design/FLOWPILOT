"use client";

import type { PasswordStrength } from "@/lib/security/input-validation";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  showRequirements?: boolean;
  fulfilled?: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
  t?: (key: string) => string;
}

const strengthLabels: Record<PasswordStrength, string> = {
  weak: "Faible",
  medium: "Moyen",
  strong: "Fort",
};

const strengthColors: Record<PasswordStrength, string> = {
  weak: "bg-red-500",
  medium: "bg-amber-500",
  strong: "bg-emerald-500",
};

const strengthTextColors: Record<PasswordStrength, string> = {
  weak: "text-red-600",
  medium: "text-amber-600",
  strong: "text-emerald-600",
};

export function PasswordStrengthIndicator({
  strength,
  showRequirements,
  fulfilled,
  t = (k) => k,
}: PasswordStrengthIndicatorProps) {
  const bars = strength === "weak" ? 1 : strength === "medium" ? 2 : 3;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= bars ? strengthColors[strength] : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${strengthTextColors[strength]}`}>
          {t ? t(`passwordStrength.${strength}`) : strengthLabels[strength]}
        </span>
      </div>

      {showRequirements && fulfilled && (
        <ul className="text-xs text-slate-600 space-y-1">
          <li className={fulfilled.minLength ? "text-emerald-600" : ""}>
            {fulfilled.minLength ? "✓" : "○"} {t ? t("passwordStrength.minLength") : "8+ caractères"}
          </li>
          <li className={fulfilled.hasLowercase ? "text-emerald-600" : ""}>
            {fulfilled.hasLowercase ? "✓" : "○"} {t ? t("passwordStrength.hasLowercase") : "Minuscule"}
          </li>
          <li className={fulfilled.hasUppercase ? "text-emerald-600" : ""}>
            {fulfilled.hasUppercase ? "✓" : "○"} {t ? t("passwordStrength.hasUppercase") : "Majuscule"}
          </li>
          <li className={fulfilled.hasDigit ? "text-emerald-600" : ""}>
            {fulfilled.hasDigit ? "✓" : "○"} {t ? t("passwordStrength.hasDigit") : "Chiffre"}
          </li>
          <li className={fulfilled.hasSpecial ? "text-emerald-600" : ""}>
            {fulfilled.hasSpecial ? "✓" : "○"} {t ? t("passwordStrength.hasSpecial") : "Caractère spécial"}
          </li>
        </ul>
      )}
    </div>
  );
}
