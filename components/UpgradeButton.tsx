"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/lib/stripe";

interface Props {
  planKey: PlanKey;
  label?: string;
  variant?: "primary" | "outline";
  className?: string;
  /** Style bouton sur carte mise en avant (fond indigo) */
  highlightCard?: boolean;
}

export default function UpgradeButton({
  planKey,
  label = "Commencer",
  variant = "primary",
  className = "",
  highlightCard = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planKey }),
      });

      const raw = await res.text();
      let data: { url?: string; error?: string };
      try {
        data = JSON.parse(raw) as { url?: string; error?: string };
      } catch {
        console.error("[UpgradeButton] Corps non-JSON:", raw.slice(0, 300), "status:", res.status);
        setError(`Réponse invalide du serveur (${res.status})`);
        return;
      }

      console.log("[UpgradeButton] Réponse API checkout:", { status: res.status, data });

      if (res.status === 401) {
        router.push(`/signup?plan=${encodeURIComponent(planKey)}`);
        return;
      }

      const url = data.url;
      if (!url || typeof url !== "string") {
        setError(data.error ?? "URL manquante");
        return;
      }

      try {
        new URL(url);
      } catch {
        console.error("[UpgradeButton] URL de redirection invalide:", url);
        setError(data.error ?? "URL de redirection invalide");
        return;
      }

      window.location.href = url;
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const baseClass =
    "w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  let variantClass: string;
  if (highlightCard) {
    variantClass =
      variant === "outline"
        ? "border-2 border-white/80 text-white bg-transparent hover:bg-white/10"
        : "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg";
  } else {
    variantClass =
      variant === "outline"
        ? "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200";
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${baseClass} ${variantClass} ${className}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Redirection...
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
