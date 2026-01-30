import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { Eye, CheckSquare2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  let errorMsg = "";
  if (sp?.error) {
    try {
      errorMsg = decodeURIComponent(sp.error);
    } catch {
      errorMsg = sp.error;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 space-y-8">
          {/* Header avec logo et micro-phrase de réassurance */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-2">
              <Logo size="lg" className="drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Connexion
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-sm mx-auto">
              Reprenez le contrôle de vos décisions.{" "}
              <span className="font-medium text-slate-900">Vous savez exactement où vous en êtes.</span>
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <form action="/auth/login" method="POST" className="space-y-5">
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
              <SubmitButton>Accéder à mon dashboard</SubmitButton>
            </div>
          </form>

          {/* Micro-bénéfices avant l'entrée */}
          <div className="pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-4 font-medium">
              En vous connectant, vous accédez à :
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                <span>Vue d'ensemble</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckSquare2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Actions tracées</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 space-y-2">
            <p className="text-sm text-slate-600">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                Mot de passe oublié ?
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
