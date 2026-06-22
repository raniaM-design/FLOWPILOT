"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Calendar,
  LogIn,
  BarChart3,
  Eye,
  FolderOpen,
  Target,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  preferredLanguage: string | null;
  createdAt: string;
  _count: {
    projects: number;
    createdDecisions: number;
    createdActions: number;
    meetings: number;
  };
}

interface UserUsageStats {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    preferredLanguage: string | null;
    createdAt: string;
    hasCompany: boolean;
  };
  totals: {
    projects: number;
    createdDecisions: number;
    createdActions: number;
    meetings: number;
  };
  thisMonth: {
    meetings: number;
    transcriptions: number;
    minutesTranscribed: number;
    reports: number;
    companyMembers: number;
  };
  last30Days: {
    pageViews: number;
    actionsCompleted: number;
    projectsCreated: number;
    topPages: Array<{ path: string; count: number }>;
  };
  lastActivity: { at: string; path: string } | null;
}

function StatBox({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-indigo-50/80 rounded-lg p-4 border border-indigo-100">
      <div className="text-2xl font-bold text-indigo-900">{value}</div>
      <div className="text-sm font-medium text-indigo-700">{label}</div>
      {sub && <div className="text-xs text-indigo-500 mt-1">{sub}</div>}
    </div>
  );
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<Record<string, UserUsageStats>>({});
  const [loadingStats, setLoadingStats] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) throw new Error("Erreur lors du chargement des utilisateurs");
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const loadUsageStats = async (userId: string) => {
    if (usageStats[userId]) return;
    setLoadingStats(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/usage`);
      if (!response.ok) throw new Error("Erreur lors du chargement des statistiques");
      const data = await response.json();
      setUsageStats((prev) => ({ ...prev, [userId]: data }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingStats(null);
    }
  };

  const toggleExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    await loadUsageStats(userId);
  };

  const handleImpersonate = async (userId: string, email: string) => {
    if (!confirm(`Vous allez vous connecter en tant que ${email}. Continuer ?`)) return;

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      const response = await fetch("/api/support/impersonate", { method: "POST", body: formData });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'impersonation");
      }
      window.location.href = "/app";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-indigo-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
          <input
            type="text"
            placeholder="Rechercher par email ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-indigo-200 overflow-hidden">
        <div className="p-4 border-b border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
          <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Utilisateurs ({filteredUsers.length})
          </h2>
          <p className="text-sm text-indigo-600 mt-1">
            Consultez les statistiques d&apos;utilisation ou connectez-vous en tant qu&apos;utilisateur pour l&apos;aider
          </p>
        </div>

        <div className="divide-y divide-indigo-100">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUserId === user.id;
            const stats = usageStats[user.id];
            const roleColors: Record<string, string> = {
              ADMIN: "bg-rose-100 text-rose-800",
              SUPPORT: "bg-cyan-100 text-cyan-800",
              USER: "bg-indigo-100 text-indigo-800",
            };

            return (
              <div key={user.id} className="hover:bg-indigo-50/30 transition-colors">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Mail className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="font-medium text-slate-900">{user.email}</span>
                        {user.name && (
                          <span className="text-sm text-slate-500">({user.name})</span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-lg ${roleColors[user.role] ?? "bg-slate-100 text-slate-800"}`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{user._count.projects} projets</span>
                        <span>{user._count.meetings} réunions</span>
                        <span>{user._count.createdActions} actions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(user.id)}
                        className="border-indigo-200"
                      >
                        <BarChart3 className="h-4 w-4 mr-1 text-indigo-600" />
                        Stats
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImpersonate(user.id, user.email)}
                        className="border-cyan-300 hover:bg-cyan-50"
                      >
                        <LogIn className="h-4 w-4 mr-1 text-cyan-600" />
                        Se substituer
                      </Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-indigo-100 bg-indigo-50/30">
                    {loadingStats === user.id ? (
                      <div className="flex items-center justify-center py-8 text-indigo-600">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Chargement des statistiques...
                      </div>
                    ) : stats ? (
                      <div className="pt-4 space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Totaux
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatBox label="Projets" value={stats.totals.projects} />
                            <StatBox label="Décisions" value={stats.totals.createdDecisions} />
                            <StatBox label="Actions" value={stats.totals.createdActions} />
                            <StatBox label="Réunions" value={stats.totals.meetings} />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Ce mois
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <StatBox label="Réunions" value={stats.thisMonth.meetings} />
                            <StatBox label="Transcriptions" value={stats.thisMonth.transcriptions} />
                            <StatBox
                              label="Minutes transcrites"
                              value={stats.thisMonth.minutesTranscribed}
                            />
                            <StatBox label="Comptes rendus" value={stats.thisMonth.reports} />
                            {stats.user.hasCompany && (
                              <StatBox
                                label="Membres entreprise"
                                value={stats.thisMonth.companyMembers}
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            30 derniers jours
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <StatBox label="Pages vues" value={stats.last30Days.pageViews} />
                            <StatBox
                              label="Actions complétées"
                              value={stats.last30Days.actionsCompleted}
                            />
                            <StatBox
                              label="Projets créés"
                              value={stats.last30Days.projectsCreated}
                            />
                          </div>
                          {stats.last30Days.topPages.length > 0 && (
                            <div className="bg-white rounded-lg border border-indigo-100 p-3">
                              <div className="text-xs font-medium text-indigo-700 mb-2">
                                Pages les plus visitées
                              </div>
                              <div className="space-y-1">
                                {stats.last30Days.topPages.map((page) => (
                                  <div
                                    key={page.path}
                                    className="flex justify-between text-sm text-slate-700"
                                  >
                                    <span className="truncate mr-2">{page.path}</span>
                                    <span className="font-medium text-indigo-600 shrink-0">
                                      {page.count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {stats.lastActivity && (
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <Target className="h-4 w-4 text-indigo-500" />
                            Dernière activité :{" "}
                            {new Date(stats.lastActivity.at).toLocaleString("fr-FR")} sur{" "}
                            <code className="text-xs bg-indigo-100 px-1 rounded">
                              {stats.lastActivity.path}
                            </code>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-sm text-slate-500">
                        Impossible de charger les statistiques
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
