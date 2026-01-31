"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, FolderOpen, Target, CheckSquare, Calendar, TrendingUp, Globe } from "lucide-react";

interface Stats {
  overview: {
    totalUsers: number;
    totalProjects: number;
    totalDecisions: number;
    totalActions: number;
    totalMeetings: number;
  };
  activity: {
    activeUsersLast30Days: number;
    projectsCreatedLast30Days: number;
    actionsCompletedLast30Days: number;
  };
  distributions: {
    usersByLanguage: Array<{ language: string; count: number }>;
    projectsByStatus: Array<{ status: string; count: number }>;
    actionsByStatus: Array<{ status: string; count: number }>;
  };
  registrations: {
    byMonth: Record<string, number>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des statistiques");
        }
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Chargement des statistiques...</div>
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

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Utilisateurs"
          value={stats.overview.totalUsers}
          color="blue"
        />
        <StatCard
          icon={<FolderOpen className="h-6 w-6" />}
          label="Projets"
          value={stats.overview.totalProjects}
          color="purple"
        />
        <StatCard
          icon={<Target className="h-6 w-6" />}
          label="Décisions"
          value={stats.overview.totalDecisions}
          color="green"
        />
        <StatCard
          icon={<CheckSquare className="h-6 w-6" />}
          label="Actions"
          value={stats.overview.totalActions}
          color="orange"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="Réunions"
          value={stats.overview.totalMeetings}
          color="pink"
        />
      </div>

      {/* Activité récente */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-md border border-slate-200/50 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          Activité des 30 derniers jours
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="text-sm font-medium text-blue-100 mb-2">Utilisateurs actifs</div>
            <div className="text-3xl font-bold">{stats.activity.activeUsersLast30Days}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="text-sm font-medium text-purple-100 mb-2">Projets créés</div>
            <div className="text-3xl font-bold">{stats.activity.projectsCreatedLast30Days}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="text-sm font-medium text-green-100 mb-2">Actions complétées</div>
            <div className="text-3xl font-bold">{stats.activity.actionsCompletedLast30Days}</div>
          </div>
        </div>
      </div>

      {/* Répartitions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Langues */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-md border border-blue-200/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500 text-white">
              <Globe className="h-4 w-4" />
            </div>
            Répartition par langue
          </h3>
          <div className="space-y-3">
            {stats.distributions.usersByLanguage.map((item, index) => {
              const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500"];
              const bgColor = colors[index % colors.length];
              return (
                <div key={item.language} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <span className="text-slate-700 font-medium">{item.language}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statuts des projets */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl shadow-md border border-purple-200/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500 text-white">
              <BarChart3 className="h-4 w-4" />
            </div>
            Statuts des projets
          </h3>
          <div className="space-y-3">
            {stats.distributions.projectsByStatus.map((item) => {
              const statusColors: Record<string, string> = {
                "ACTIVE": "bg-green-500",
                "ON_HOLD": "bg-yellow-500",
                "COMPLETED": "bg-blue-500",
                "CANCELLED": "bg-red-500",
              };
              const bgColor = statusColors[item.status] || "bg-slate-500";
              return (
                <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <span className="text-slate-700 font-medium">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statuts des actions */}
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl shadow-md border border-green-200/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-500 text-white">
              <CheckSquare className="h-4 w-4" />
            </div>
            Statuts des actions
          </h3>
          <div className="space-y-3">
            {stats.distributions.actionsByStatus.map((item) => {
              const statusColors: Record<string, string> = {
                "TODO": "bg-blue-500",
                "DOING": "bg-yellow-500",
                "DONE": "bg-green-500",
                "BLOCKED": "bg-red-500",
              };
              const bgColor = statusColors[item.status] || "bg-slate-500";
              return (
                <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <span className="text-slate-700 font-medium">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inscriptions par mois */}
      {Object.keys(stats.registrations.byMonth).length > 0 && (
        <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md border border-indigo-200/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500 text-white">
              <Calendar className="h-4 w-4" />
            </div>
            Inscriptions par mois
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.registrations.byMonth)
              .sort()
              .map(([month, count], index) => {
                const maxCount = Math.max(...Object.values(stats.registrations.byMonth));
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-700 font-medium">
                        {new Date(month + "-01").toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                      </span>
                      <span className="font-bold text-indigo-600">{count}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "purple" | "green" | "orange" | "pink";
}) {
  const colorConfigs = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
      iconBg: "bg-blue-500",
      text: "text-blue-700",
      border: "border-blue-200/50",
      value: "text-blue-900",
    },
    purple: {
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-gradient-to-br from-purple-50 to-purple-100/50",
      iconBg: "bg-purple-500",
      text: "text-purple-700",
      border: "border-purple-200/50",
      value: "text-purple-900",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      bg: "bg-gradient-to-br from-green-50 to-green-100/50",
      iconBg: "bg-green-500",
      text: "text-green-700",
      border: "border-green-200/50",
      value: "text-green-900",
    },
    orange: {
      gradient: "from-orange-500 to-orange-600",
      bg: "bg-gradient-to-br from-orange-50 to-orange-100/50",
      iconBg: "bg-orange-500",
      text: "text-orange-700",
      border: "border-orange-200/50",
      value: "text-orange-900",
    },
    pink: {
      gradient: "from-pink-500 to-pink-600",
      bg: "bg-gradient-to-br from-pink-50 to-pink-100/50",
      iconBg: "bg-pink-500",
      text: "text-pink-700",
      border: "border-pink-200/50",
      value: "text-pink-900",
    },
  };

  const config = colorConfigs[color];

  return (
    <div className={`${config.bg} rounded-xl shadow-md border ${config.border} p-6 hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${config.iconBg} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-bold ${config.value} mb-1`}>{value.toLocaleString()}</div>
      <div className={`text-sm font-medium ${config.text}`}>{label}</div>
    </div>
  );
}

