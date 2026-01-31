"use client";

import { useEffect, useState } from "react";
import { Users, Key, LogIn, Search, Mail, Calendar, Shield } from "lucide-react";
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

export default function SupportDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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

    fetchUsers();
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Users className="h-5 w-5" />
            <span className="text-sm">Total utilisateurs</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Admins</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {users.filter((u) => u.role === "ADMIN").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Mail className="h-5 w-5" />
            <span className="text-sm">Support</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {users.filter((u) => u.role === "SUPPORT").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Aujourd'hui</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {
              users.filter((u) => {
                const created = new Date(u.createdAt);
                const today = new Date();
                return created.toDateString() === today.toDateString();
              }).length
            }
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Utilisateurs ({filteredUsers.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{user.email}</span>
                    {user.role !== "USER" && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    {user.preferredLanguage && ` • Langue: ${user.preferredLanguage}`}
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
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Réinitialiser mot de passe
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImpersonate(user.id)}
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Se connecter en tant que
                  </Button>
                </div>
              </div>
            </div>
          ))}
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

