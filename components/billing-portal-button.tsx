"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BillingPortalButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenPortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push("/app/account/subscription");
      }
    } catch (error) {
      console.error("Erreur:", error);
      router.push("/app/account/subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleOpenPortal} disabled={isLoading}>
      {isLoading ? "Chargement..." : "Ouvrir le portail de gestion"}
    </Button>
  );
}

