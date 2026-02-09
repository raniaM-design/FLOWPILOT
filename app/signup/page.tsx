import Link from "next/link";
import { Logo } from "@/components/logo";
import { getTranslations } from "@/i18n/request";
import SignupForm from "@/components/SignupForm";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-8 space-y-5 sm:space-y-6">
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="flex items-center justify-center mb-1">
              <Logo size="lg" className="drop-shadow-sm" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">{t("signupTitle")}</h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              {t("signupSubtitle")}
            </p>
          </div>

          <SignupForm errorMsg={errorMsg} />

          <div className="text-center pt-4 border-t border-slate-200">
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
