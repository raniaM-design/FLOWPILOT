"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Plus, Mail, Calendar, Shield, X, Copy, CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Company {
  id: string;
  name: string;
  domain: string | null;
  members: Array<{
    id: string;
    email: string;
    role: string;
    isCompanyAdmin: boolean;
    createdAt: string;
  }>;
}

export interface CompanyManagementProps {
  userCompany: Company | null;
  isCompanyAdmin: boolean;
}

export default function CompanyManagement({ userCompany, isCompanyAdmin }: CompanyManagementProps) {
  const [company, setCompany] = useState<Company | null>(userCompany);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [joinCompanyId, setJoinCompanyId] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [promotingMemberId, setPromotingMemberId] = useState<string | null>(null);
  const [invitingEmail, setInvitingEmail] = useState<string | null>(null);

  // Recharger les données de l'entreprise
  const refreshCompany = async () => {
    try {
      const response = await fetch("/api/company/members");
      if (response.ok) {
        // Recharger la page pour avoir les données complètes
        window.location.reload();
      }
    } catch (err) {
      console.error("Erreur lors du rechargement:", err);
    }
  };

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
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) {
      setError("L'email est requis");
      return;
    }

    setInvitingEmail(inviteEmail.trim());
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/company/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'invitation");
      }

      setSuccess(`Invitation envoyée avec succès à ${inviteEmail.trim()}`);
      setInviteEmail("");
      setShowInviteForm(false);
      setInvitingEmail(null);
    } catch (err: any) {
      setError(err.message);
      setInvitingEmail(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setError("L'email est requis");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/company/members/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout");
      }

      setSuccess(`Membre ajouté avec succès : ${data.member.email}`);
      setNewMemberEmail("");
      setShowAddMemberForm(false);
      refreshCompany();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre de l'entreprise ?")) {
      return;
    }

    setRemovingMemberId(memberId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/company/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du retrait");
      }

      setSuccess("Membre retiré avec succès");
      refreshCompany();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handlePromoteMember = async (memberId: string, promote: boolean) => {
    setPromotingMemberId(memberId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/company/members/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, isAdmin: promote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la modification");
      }

      setSuccess(promote ? "Membre promu administrateur" : "Membre rétrogradé");
      refreshCompany();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPromotingMemberId(null);
    }
  };

  const copyCompanyId = () => {
    if (company?.id) {
      navigator.clipboard.writeText(company.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (company) {
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

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl shadow-md border border-blue-200/50 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
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
            {isCompanyAdmin && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowInviteForm(!showInviteForm);
                    setShowAddMemberForm(false);
                  }}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Inviter par email
                </Button>
                <Button
                  onClick={() => {
                    setShowAddMemberForm(!showAddMemberForm);
                    setShowInviteForm(false);
                  }}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Ajouter un membre
                </Button>
              </div>
            )}
          </div>

          {/* ID de l'entreprise pour permettre aux autres de rejoindre */}
          {isCompanyAdmin && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">ID de l'entreprise</p>
                  <p className="text-xs text-slate-500">Partagez cet ID pour permettre à d'autres de rejoindre</p>
                </div>
                <Button
                  onClick={copyCompanyId}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copiedId ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                <code className="text-sm font-mono text-slate-700">{company.id}</code>
              </div>
            </div>
          )}

          {/* Formulaire d'ajout de membre */}
          {showAddMemberForm && isCompanyAdmin && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-3">Ajouter un membre</h3>
              <div className="flex gap-2">
                <Input
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  type="email"
                  className="flex-1"
                />
                <Button onClick={handleAddMember} disabled={loading || !newMemberEmail.trim()}>
                  {loading ? "Ajout..." : "Ajouter"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMemberForm(false);
                    setNewMemberEmail("");
                    setError(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                L'utilisateur doit avoir un compte existant avec cet email
              </p>
            </div>
          )}

          {/* Liste des membres */}
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{member.email}</p>
                        {member.isCompanyAdmin && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Membre depuis {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {isCompanyAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!member.isCompanyAdmin ? (
                          <DropdownMenuItem
                            onClick={() => handlePromoteMember(member.id, true)}
                            disabled={promotingMemberId === member.id}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Promouvoir admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handlePromoteMember(member.id, false)}
                            disabled={promotingMemberId === member.id}
                          >
                            Rétrograder membre
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removingMemberId === member.id}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Retirer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
