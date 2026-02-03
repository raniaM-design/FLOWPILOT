"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

export default function SubmitButtonSignup({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const t = useTranslations("auth");

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {pending ? t("signupButtonLoading") : children}
    </button>
  );
}

