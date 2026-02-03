"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import Link from "next/link";

export default function AcceptCompanyInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token d'invitation manquant");
      return;
    }

    const acceptInvitation = async () => {
      try {
        const response = await fetch(`/api/company/invitations/accept?token=${token}`, {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.error?.includes("expiré") || data.error?.includes("expired")) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
          setMessage(data.error || "Erreur lors de l'acceptation de l'invitation");
          return;
        }

        setStatus("success");
        setMessage(data.message || "Invitation acceptée avec succès");
        setCompanyName(data.companyName || "");

        // Rediriger vers le dashboard après 3 secondes
        setTimeout(() => {
          router.push("/app");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setMessage("Erreur lors de l'acceptation de l'invitation");
      }
    };

    acceptInvitation();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <FlowCard className="max-w-md w-full">
        <FlowCardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Traitement de l'invitation...
              </h1>
              <p className="text-slate-600">Veuillez patienter</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Invitation acceptée !
              </h1>
              {companyName && (
                <p className="text-lg text-slate-700 mb-4">
                  Vous avez rejoint <strong>{companyName}</strong>
                </p>
              )}
              <p className="text-slate-600 mb-6">{message}</p>
              <p className="text-sm text-slate-500 mb-4">
                Redirection vers le dashboard...
              </p>
              <Link href="/app">
                <Button>Aller au dashboard</Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Erreur
              </h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link href="/login">
                <Button variant="outline">Se connecter</Button>
              </Link>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Invitation expirée
              </h1>
              <p className="text-slate-600 mb-6">
                Cette invitation a expiré. Veuillez demander une nouvelle invitation à un administrateur de l'entreprise.
              </p>
              <Link href="/login">
                <Button variant="outline">Se connecter</Button>
              </Link>
            </>
          )}
        </FlowCardContent>
      </FlowCard>
    </div>
  );
}

