import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { Logo } from "@/components/logo";
import { Mail } from "lucide-react";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const sp = await searchParams;
  let errorMsg = "";
  let successMsg = "";

  if (sp?.error) {
    try {
      errorMsg = decodeURIComponent(sp.error);
    } catch {
      errorMsg = sp.error;
    }
  }

  if (sp?.success) {
    try {
      successMsg = decodeURIComponent(sp.success);
    } catch {
      successMsg = sp.success;
    }
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
              Mot de passe oublié
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-sm mx-auto">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          <form action="/api/auth/forgot-password" method="POST" className="space-y-5" id="forgot-password-form">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton>Envoyer le lien de réinitialisation</SubmitButton>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-600">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

