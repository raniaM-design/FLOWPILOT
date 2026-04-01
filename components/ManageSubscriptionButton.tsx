"use client";

import { useState } from "react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Impossible d’ouvrir le portail. Avez-vous un abonnement actif ?");
      }
    } catch {
      alert("Erreur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-indigo-600 underline-offset-2 hover:text-indigo-800 disabled:opacity-50"
    >
      {loading ? "Chargement..." : "Gérer mon abonnement →"}
    </button>
  );
}
