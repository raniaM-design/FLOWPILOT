import Link from "next/link";
import SubmitButtonSignup from "@/components/SubmitButtonSignup";
import { Logo } from "@/components/logo";
import { getTranslations } from "@/i18n/request";

export default async function SignupPage({
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

  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-2">
              <Logo size="lg" className="drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("signupTitle")}</h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-sm mx-auto">
              {t("signupSubtitle")}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <form action="/auth/signup" method="POST" className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
                {t("email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-2">
                {t("password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder={t("passwordPlaceholder")}
                minLength={8}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 transition-all"
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("passwordMinLength")}
              </p>
            </div>

            <SubmitButtonSignup>{t("signupButton")}</SubmitButtonSignup>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-600">
              {t("alreadyHaveAccount")}{" "}
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
