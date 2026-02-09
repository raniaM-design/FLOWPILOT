"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import SubmitButtonSignup from "@/components/SubmitButtonSignup";

interface SignupFormProps {
  errorMsg?: string;
}

export default function SignupForm({ errorMsg }: SignupFormProps) {
  const t = useTranslations("auth");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handlePasswordChange = () => {
    const password = passwordRef.current?.value || "";
    const confirmPassword = confirmPasswordRef.current?.value || "";
    
    if (confirmPassword.length > 0) {
      setPasswordMatch(password === confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const password = passwordRef.current?.value || "";
    const confirmPassword = confirmPasswordRef.current?.value || "";

    if (password !== confirmPassword) {
      e.preventDefault();
      setPasswordMatch(false);
      confirmPasswordRef.current?.focus();
      return false;
    }

    setPasswordMatch(true);
  };

  return (
    <form
      ref={formRef}
      action="/auth/signup"
      method="POST"
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-5"
    >
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm">
          {errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
          {t("password")}
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
            minLength={8}
            onChange={handlePasswordChange}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all pr-9 sm:pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.367 5.19l-3.59-3.59a3 3 0 00-4.243-4.243L3 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {t("passwordMinLength")}
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
          {t("confirmPassword")}
        </label>
        <div className="relative">
          <input
            ref={confirmPasswordRef}
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder={t("confirmPasswordPlaceholder")}
            onChange={handlePasswordChange}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all pr-9 sm:pr-10 ${
              passwordMatch
                ? "border-slate-300 focus:ring-blue-500"
                : "border-red-300 focus:ring-red-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.367 5.19l-3.59-3.59a3 3 0 00-4.243-4.243L3 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {!passwordMatch && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("passwordsDoNotMatch")}
          </p>
        )}
      </div>

      <SubmitButtonSignup>{t("signupButton")}</SubmitButtonSignup>

      {/* Séparateur */}
      <div className="relative pt-3 sm:pt-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-2 bg-white text-slate-500">{t("orContinueWith") || "Ou continuer avec"}</span>
        </div>
      </div>

      {/* Bouton Google */}
      <div className="pt-1 sm:pt-2">
        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white border-2 border-slate-300 hover:border-slate-400 active:bg-slate-50 text-slate-700 text-sm sm:text-base font-medium py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg shadow-sm hover:shadow-md transition-all touch-manipulation"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="truncate">{t("continueWithGoogle") || "Continuer avec Google"}</span>
        </a>
      </div>
    </form>
  );
}

