"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CheckoutSuccessToast() {
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 6000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  if (!showSuccess) return null;

  return (
    <div
      className="fixed right-4 top-4 z-50 flex animate-in items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-white shadow-xl slide-in-from-top"
      role="status"
    >
      <span aria-hidden>🎉</span>
      <span className="font-semibold">Bienvenue dans PILOTYS Pro !</span>
    </div>
  );
}
