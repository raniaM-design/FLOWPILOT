"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Calendar, CheckSquare2, AlertTriangle, ArrowRight, Settings, Mail, UserPlus, X, Shield, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface CompanyPageStats {
  memberCount: number;
  activeProjectsCount: number;
  meetingsThisMonth: number;
  actionsInProgress: number;
  overdueActions: number;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    actionsInProgress: number;
    decisionsCount: number;
    nextDueDate: Date | null;
  }>;
}

interface Company {
  id: string;
  name: string;
  domain: string | null;
  members: Array<{
    id: string;
    email: string;
    name?: string | null;
    role: string;
    isCompanyAdmin: boolean;
    createdAt: string;
  }>;
}

interface CompanyPageContentProps {
  company: Company | null;
  stats: CompanyPageStats;
  isCompanyAdmin: boolean;
}

export function CompanyPageContent({ company, stats, isCompanyAdmin: initialIsCompanyAdmin, hasAnyAdmin: serverHasAnyAdmin }: CompanyPageContentProps) {
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(initialIsCompanyAdmin);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(serverHasAnyAdmin ?? false);
  const [promotingMemberId, setPromotingMemberId] = useState<string | null>(null);

  // IMPORTANT: Utiliser la valeur du serveur comme source de vérité absolue
  // Le serveur fait une vérification directe en base de données (prisma.user.count)
  // Ne PAS recalculer depuis les membres chargés car Prisma peut ne pas retourner correctement isCompanyAdmin
  useEffect(() => {
    // Utiliser la valeur du serveur (vérification directe en base de données)
    if (serverHasAnyAdmin !== undefined) {
      setHasAnyAdmin(serverHasAnyAdmin);
      console.log("[CompanyPageContent] 🔍 Utilisation de hasAnyAdmin du serveur:", serverHasAnyAdmin);
    }
  }, [serverHasAnyAdmin]);
  
  // Note: On ne recalcule pas hasAnyAdmin depuis company.members car ils peuvent être incorrects
  // Si un membre est ajouté/supprimé, la page sera rechargée et le serveur recalculera

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      const months = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return null;
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
      // Recharger la page pour voir le nouveau membre
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      setPromotingMemberId(null);
      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setPromotingMemberId(null);
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) {
      setError("L'email est requis");
      return;
    }

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfPromote = async () => {
    if (!confirm("Êtes-vous sûr de vouloir devenir administrateur de cette entreprise ?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/company/members/self-promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la promotion");
      }

      setSuccess("Vous êtes maintenant administrateur de l'entreprise !");
      setIsCompanyAdmin(true);
      setHasAnyAdmin(true);
      // Recharger la page pour voir les nouveaux boutons
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      // Faire disparaître le message d'erreur après 5 secondes
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Bannière pour se promouvoir admin si aucun admin n'existe */}
      {!isCompanyAdmin && !hasAnyAdmin && company && (
        <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500 text-white">
                <Crown className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Devenir administrateur de l'entreprise
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Aucun administrateur n'a été défini pour cette entreprise. Vous pouvez devenir administrateur pour gérer les membres et les paramètres.
                </p>
                <Button
                  onClick={handleSelfPromote}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {loading ? "Promotion en cours..." : "Devenir administrateur"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* 4 Cards Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Membres */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-purple-700">Membres</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.memberCount}</div>
            <p className="text-xs text-purple-600 mt-1">Total entreprise</p>
          </CardContent>
        </Card>

        {/* Card Projets actifs */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <CheckSquare2 className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-blue-700">Projets actifs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.activeProjectsCount}</div>
            <p className="text-xs text-blue-600 mt-1">Accessibles</p>
          </CardContent>
        </Card>

        {/* Card Réunions */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-indigo-700">Réunions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">{stats.meetingsThisMonth}</div>
            <p className="text-xs text-indigo-600 mt-1">Ce mois-ci</p>
          </CardContent>
        </Card>

        {/* Card Actions en cours */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckSquare2 className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-green-700">Actions en cours</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-900">{stats.actionsInProgress}</span>
              {stats.overdueActions > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.overdueActions} en retard
                </Badge>
              )}
            </div>
            <p className="text-xs text-green-600 mt-1">Accessibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Card Entreprise */}
      {company && (
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-blue-200/50 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">{company.name}</CardTitle>
                  {company.domain && (
                    <CardDescription className="mt-1 text-slate-600">{company.domain}</CardDescription>
                  )}
                </div>
              </div>
              {isCompanyAdmin && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowInviteForm(!showInviteForm);
                      setShowAddMemberForm(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Inviter par email
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    onClick={() => {
                      setShowAddMemberForm(!showAddMemberForm);
                      setShowInviteForm(false);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter un membre
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Formulaire d'invitation par email */}
      {showInviteForm && isCompanyAdmin && (
        <Card className="border-blue-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Inviter par email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Envoyez une invitation par email à un utilisateur pour rejoindre votre entreprise.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    type="email"
                    className="flex-1"
                  />
                  <Button onClick={handleInviteByEmail} disabled={loading || !inviteEmail.trim()}>
                    {loading ? "Envoi..." : "Envoyer l'invitation"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteEmail("");
                      setError(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'ajout de membre */}
      {showAddMemberForm && isCompanyAdmin && (
        <Card className="border-blue-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Ajouter un membre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Ajoutez un utilisateur existant à votre entreprise. L'utilisateur doit avoir un compte avec cet email.
                </p>
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
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Membres */}
      {company && (
        <Card className="border-purple-200/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                Membres ({company.members.length})
              </CardTitle>
              {isCompanyAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddMemberForm(!showAddMemberForm);
                    setShowInviteForm(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Ajouter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {company.members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">Aucun membre pour le moment.</p>
                {isCompanyAdmin && (
                  <Button
                    onClick={() => {
                      setShowAddMemberForm(true);
                      setShowInviteForm(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter le premier membre
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {company.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-transparent hover:from-purple-100/50 hover:to-purple-50/30 border border-purple-100/50 transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {member.name || member.email.split("@")[0]}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">{member.email}</p>
                        {member.name && <span className="text-xs text-slate-400">•</span>}
                        {member.role && (
                          <p className="text-xs text-slate-600">{member.role}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.isCompanyAdmin && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-sm">
                        Admin
                      </Badge>
                    )}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section Projets en cours */}
      {stats.projects.length > 0 && (
        <Card className="border-blue-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <CheckSquare2 className="h-4 w-4 text-white" />
              </div>
              Projets en cours ({stats.projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-transparent hover:from-blue-100/50 hover:to-blue-50/30 border border-blue-200/50 transition-all duration-150"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <CheckSquare2 className="h-3.5 w-3.5 text-green-600" />
                        {project.actionsInProgress} actions en cours
                      </span>
                      {project.decisionsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckSquare2 className="h-3.5 w-3.5 text-purple-600" />
                          {project.decisionsCount} décisions
                        </span>
                      )}
                      {project.nextDueDate && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-orange-600" />
                          Prochaine échéance: {formatDate(project.nextDueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-md shadow-blue-500/25" asChild>
                    <Link href={`/app/projects/${project.id}`}>
                      Voir projet
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.projects.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-500">Aucun projet accessible pour le moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

