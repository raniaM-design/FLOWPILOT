import Link from "next/link";
import { Eye, CheckSquare2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login/login-form";
import { getTranslations } from "@/i18n/request";

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

  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/60 p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Header avec logo et micro-phrase de réassurance */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <Logo size="lg" className="drop-shadow-sm" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              {t("loginTitle")}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm mx-auto">
              {t("loginSubtitle")}{" "}
              <span className="font-medium text-slate-900">{t("loginSubtitleBold")}</span>
            </p>
          </div>

          <LoginForm errorMsg={errorMsg} />

          {/* Micro-bénéfices avant l'entrée */}
          <div className="pt-4 sm:pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3 sm:mb-4 font-medium">
              {t("loginBenefits")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                <span className="whitespace-nowrap">{t("loginBenefitOverview")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckSquare2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span className="whitespace-nowrap">{t("loginBenefitActions")}</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 space-y-2">
            <p className="text-sm text-slate-600">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                {t("forgotPassword")}
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              {t("noAccount")}{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                {t("createAccount")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
