"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { isValidPassword } from "@/lib/security/input-validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("auth");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordValidation = useMemo(() => isValidPassword(password), [password]);

  useEffect(() => {
    if (!token) {
      setError(t("tokenMissingError"));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("tokenMissingError"));
      return;
    }

    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0] || t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", password);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("errorOccurred"));
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?success=" + encodeURIComponent(t("resetPasswordSuccessRedirect")));
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      setError(t("errorOccurredRetry"));
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-2">
                <Logo size="lg" className="drop-shadow-sm" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {t("tokenMissing")}
              </h1>
              <p className="text-base text-slate-600">
                {t("tokenMissingMessage")}
              </p>
              <Link href="/forgot-password">
                <Button variant="outline">{t("requestNewLink")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-2">
                <Logo size="lg" className="drop-shadow-sm" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {t("resetPasswordSuccess")}
              </h1>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {t("resetPasswordSuccessMessage")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 space-y-8">
          {/* Header avec logo */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-2">
              <Logo size="lg" className="drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {t("resetPasswordTitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-sm mx-auto">
              {t("resetPasswordSubtitle")}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-2">
                {t("newPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder={t("passwordMinLength")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all ${
                    password && !passwordValidation.valid ? "border-amber-300 focus:ring-amber-500" : "border-slate-300 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2">
                <PasswordStrengthIndicator
                  strength={passwordValidation.strength}
                  showRequirements={true}
                  fulfilled={passwordValidation.fulfilled}
                  t={(k) => t(k as any)}
                />
              </div>
              {password && !passwordValidation.valid && (
                <p className="mt-1.5 text-xs text-amber-600">{t("passwordTooWeak")}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-900 mb-2">
                {t("confirmPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading || !passwordValidation.valid || password !== confirmPassword}
                className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white"
              >
                {isLoading ? t("resetPasswordButtonLoading") : t("resetPasswordButton")}
              </Button>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-600">
              {t("rememberPassword")}{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                {t("login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

