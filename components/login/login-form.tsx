"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";

interface LoginFormProps {
  errorMsg?: string;
}

export function LoginForm({ errorMsg }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form 
      action="/auth/login" 
      method="POST" 
      className="space-y-5"
      onSubmit={() => {
        setIsSubmitting(true);
      }}
    >
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="votre@email.com"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-2">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Connexion..." : "Accéder à mon dashboard"}
        </button>
      </div>
    </form>
  );
}

