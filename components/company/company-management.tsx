"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Plus, Mail, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: string;
  name: string;
  domain: string | null;
  members: Array<{
    id: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

interface CompanyManagementProps {
  userCompany: Company | null;
}

export default function CompanyManagement({ userCompany }: CompanyManagementProps) {
  const [company, setCompany] = useState<Company | null>(userCompany);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [joinCompanyId, setJoinCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      setError("Le nom de l'entreprise est requis");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          domain: companyDomain.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      setSuccess("Entreprise créée avec succès !");
      setShowCreateForm(false);
      setCompanyName("");
      setCompanyDomain("");
      // Recharger la page pour afficher la nouvelle entreprise
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCompany = async () => {
    if (!joinCompanyId.trim()) {
      setError("L'ID de l'entreprise est requis");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/company/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: joinCompanyId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la jointure");
      }

      setSuccess("Vous avez rejoint l'entreprise avec succès !");
      setShowJoinForm(false);
      setJoinCompanyId("");
      // Recharger la page
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (company) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl shadow-md border border-blue-200/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
              {company.domain && (
                <p className="text-sm text-slate-600">Domaine: {company.domain}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Membres ({company.members.length})
            </h3>
            <div className="space-y-2">
              {company.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.email}</p>
                      <p className="text-xs text-slate-500">
                        Membre depuis {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {member.role !== "USER" && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      {member.role}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Vous n'êtes pas encore membre d'une entreprise
        </h2>
        <p className="text-slate-600 mb-6">
          Créez une nouvelle entreprise ou rejoignez une entreprise existante pour collaborer avec vos collègues.
        </p>

        <div className="space-y-4">
          {!showCreateForm && !showJoinForm && (
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setShowCreateForm(true);
                  setShowJoinForm(false);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer une entreprise
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowJoinForm(true);
                  setShowCreateForm(false);
                }}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Rejoindre une entreprise
              </Button>
            </div>
          )}

          {showCreateForm && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-slate-900">Créer une entreprise</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Mon Entreprise"
                  className="max-w-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Domaine email (optionnel)
                </label>
                <Input
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="Ex: monentreprise.com"
                  className="max-w-md"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Si spécifié, seuls les utilisateurs avec un email de ce domaine pourront rejoindre
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateCompany} disabled={loading}>
                  {loading ? "Création..." : "Créer"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCompanyName("");
                    setCompanyDomain("");
                    setError(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {showJoinForm && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-slate-900">Rejoindre une entreprise</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ID de l'entreprise *
                </label>
                <Input
                  value={joinCompanyId}
                  onChange={(e) => setJoinCompanyId(e.target.value)}
                  placeholder="Entrez l'ID de l'entreprise"
                  className="max-w-md"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Demandez l'ID de l'entreprise à un administrateur
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleJoinCompany} disabled={loading}>
                  {loading ? "Rejoindre..." : "Rejoindre"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinCompanyId("");
                    setError(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

