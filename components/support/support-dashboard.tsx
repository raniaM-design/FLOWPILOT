"use client";

import { useEffect, useState } from "react";
import { Users, Key, LogIn, Search, Mail, Calendar, Shield, BarChart3, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  role: string;
  preferredLanguage: string | null;
  createdAt: string;
  _count?: {
    projects: number;
    createdDecisions: number;
    createdActions: number;
    meetings: number;
  };
}

interface SupportStats {
  overview: {
    totalUsers: number;
    activeUsersLast7Days: number;
    newUsersLast7Days: number;
    usersWithIssues: number;
    totalProjects: number;
    totalActions: number;
  };
  usersByRole: Array<{ role: string; count: number }>;
}

export default function SupportDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/support/users");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des utilisateurs");
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchStats() {
      try {
        const response = await fetch("/api/support/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchUsers();
    fetchStats();
  }, []);

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("password", newPassword);

      const response = await fetch(`/api/support/users/${userId}/reset-password`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la réinitialisation");
      }

      alert("Mot de passe réinitialisé avec succès");
      setResetPasswordModal(false);
      setNewPassword("");
      setSelectedUser(null);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleImpersonate = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir vous connecter en tant que cet utilisateur ?")) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("userId", userId);

      const response = await fetch("/api/support/impersonate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'impersonation");
      }

      // Rediriger vers la page d'accueil (l'utilisateur sera maintenant connecté)
      window.location.href = "/";
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Chargement des utilisateurs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur par email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Statistiques détaillées */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg border border-blue-400/50 p-6 text-white hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-blue-100">Total utilisateurs</span>
            </div>
            <div className="text-4xl font-bold">{stats.overview.totalUsers}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg border border-green-400/50 p-6 text-white hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-green-100">Actifs (7j)</span>
            </div>
            <div className="text-4xl font-bold">{stats.overview.activeUsersLast7Days}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg border border-emerald-400/50 p-6 text-white hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-emerald-100">Nouveaux (7j)</span>
            </div>
            <div className="text-4xl font-bold">{stats.overview.newUsersLast7Days}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg border border-orange-400/50 p-6 text-white hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-orange-100">Utilisateurs inactifs</span>
            </div>
            <div className="text-4xl font-bold">{stats.overview.usersWithIssues}</div>
            <p className="text-xs text-orange-100 mt-2">Sans projets ni actions</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg border border-purple-400/50 p-6 text-white hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-purple-100">Total projets</span>
            </div>
            <div className="text-4xl font-bold">{stats.overview.totalProjects}</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg border border-indigo-400/50 p-6 text-white hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-indigo-100">Total actions</span>
            </div>
            <div className="text-4xl font-bold">{stats.overview.totalActions}</div>
          </div>
        </div>
      )}

      {/* Répartition par rôle */}
      {stats && stats.usersByRole.length > 0 && (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-md border border-slate-200/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 text-white">
              <Shield className="h-4 w-4" />
            </div>
            Répartition par rôle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.usersByRole.map((item) => {
              const roleColors: Record<string, { gradient: string; text: string }> = {
                USER: { gradient: "from-blue-500 to-blue-600", text: "text-blue-100" },
                ADMIN: { gradient: "from-red-500 to-red-600", text: "text-red-100" },
                SUPPORT: { gradient: "from-green-500 to-green-600", text: "text-green-100" },
              };
              const colors = roleColors[item.role] || { gradient: "from-slate-500 to-slate-600", text: "text-slate-100" };
              return (
                <div key={item.role} className={`bg-gradient-to-br ${colors.gradient} rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200`}>
                  <div className={`text-sm font-medium ${colors.text} mb-2`}>{item.role}</div>
                  <div className="text-3xl font-bold">{item.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl shadow-md border border-slate-200/50 overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Utilisateurs ({filteredUsers.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-200/50">
          {filteredUsers.map((user) => {
            const roleColors: Record<string, { bg: string; text: string }> = {
              ADMIN: { bg: "bg-red-100", text: "text-red-800" },
              SUPPORT: { bg: "bg-green-100", text: "text-green-800" },
              USER: { bg: "bg-blue-100", text: "text-blue-800" },
            };
            const roleColor = roleColors[user.role] || { bg: "bg-slate-100", text: "text-slate-800" };
            return (
              <div key={user.id} className="p-4 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-slate-900">{user.email}</span>
                      {user.role !== "USER" && (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${roleColor.bg} ${roleColor.text} shadow-sm`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-slate-600 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
                      {user.preferredLanguage && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>Langue: {user.preferredLanguage}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setResetPasswordModal(true);
                      }}
                      className="border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Key className="h-4 w-4 mr-1 text-blue-600" />
                      Réinitialiser mot de passe
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImpersonate(user.id)}
                      className="border-green-200 hover:bg-green-50 hover:border-green-300"
                    >
                      <LogIn className="h-4 w-4 mr-1 text-green-600" />
                      Se connecter en tant que
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de réinitialisation de mot de passe */}
      {resetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Réinitialiser le mot de passe
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Pour l'utilisateur: <strong>{selectedUser.email}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Nouveau mot de passe (minimum 8 caractères)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez le nouveau mot de passe"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetPasswordModal(false);
                    setNewPassword("");
                    setSelectedUser(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  disabled={newPassword.length < 8}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

