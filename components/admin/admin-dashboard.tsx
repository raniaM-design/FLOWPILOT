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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Activité des 30 derniers jours
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Utilisateurs actifs</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{stats.activity.activeUsersLast30Days}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Projets créés</div>
            <div className="text-2xl font-bold text-purple-900 mt-1">{stats.activity.projectsCreatedLast30Days}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Actions complétées</div>
            <div className="text-2xl font-bold text-green-900 mt-1">{stats.activity.actionsCompletedLast30Days}</div>
          </div>
        </div>
      </div>

      {/* Répartitions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Langues */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Répartition par langue
          </h3>
          <div className="space-y-2">
            {stats.distributions.usersByLanguage.map((item) => (
              <div key={item.language} className="flex items-center justify-between">
                <span className="text-slate-600">{item.language}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statuts des projets */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statuts des projets
          </h3>
          <div className="space-y-2">
            {stats.distributions.projectsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-slate-600">{item.status}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statuts des actions */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Statuts des actions
          </h3>
          <div className="space-y-2">
            {stats.distributions.actionsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-slate-600">{item.status}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inscriptions par mois */}
      {Object.keys(stats.registrations.byMonth).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Inscriptions par mois</h3>
          <div className="space-y-2">
            {Object.entries(stats.registrations.byMonth)
              .sort()
              .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {new Date(month + "-01").toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                  </span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))}
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
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    pink: "bg-pink-50 text-pink-600 border-pink-200",
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${colorClasses[color]} p-6`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
      <div className="text-sm text-slate-600 mt-1">{label}</div>
    </div>
  );
}

