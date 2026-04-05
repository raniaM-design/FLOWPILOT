"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, FolderOpen, Target, CheckSquare, Calendar, TrendingUp, Globe, Eye, User, Bot, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPilotTab } from "@/components/admin/admin-pilot-tab";
import { AdminUserReviewsTab } from "@/components/admin/admin-user-reviews-tab";

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
  analytics?: {
    period: {
      days: number;
      startDate: string;
      endDate: string;
    };
    overview: {
      totalViews: number;
      uniqueVisitors: number;
      anonymousViews: number;
    };
    viewsByPath: Array<{ path: string; count: number }>;
    viewsByUser: Array<{ userId: string | null; userName: string; userEmail: string | null; count: number }>;
    viewsByDay: Array<{ date: string; count: number }>;
    topPages: Array<{ path: string; count: number }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsResponse, analyticsResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/analytics/stats?days=30").catch(() => null), // Ne pas bloquer si analytics échoue
        ]);

        if (!statsResponse.ok) {
          throw new Error("Erreur lors du chargement des statistiques");
        }

        const statsData = await statsResponse.json();
        let analyticsData = null;

        if (analyticsResponse && analyticsResponse.ok) {
          analyticsData = await analyticsResponse.json();
        }

        setStats({
          ...statsData,
          analytics: analyticsData,
        });
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
        <div className="text-indigo-600">Chargement des statistiques...</div>
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
    <Tabs defaultValue="overview" className="w-full space-y-6">
      <TabsList className="flex flex-wrap bg-indigo-100/80 text-indigo-900">
        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
        <TabsTrigger value="reviews" className="gap-1.5">
          <Star className="h-4 w-4" />
          Avis utilisateurs
        </TabsTrigger>
        <TabsTrigger value="pilot" className="gap-1.5">
          <Bot className="h-4 w-4" />
          Pilot
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reviews" className="mt-0 outline-none">
        <AdminUserReviewsTab />
      </TabsContent>

      <TabsContent value="pilot" className="mt-0 outline-none">
        <AdminPilotTab />
      </TabsContent>

      <TabsContent value="overview" className="mt-0 space-y-8 outline-none">
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
      <div className="bg-white rounded-xl shadow-md border border-indigo-200 p-6">
        <h2 className="text-xl font-semibold text-indigo-900 mb-6 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          Activité des 30 derniers jours
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg border border-indigo-500 hover:shadow-xl transition-all duration-200">
            <div className="text-sm font-medium text-indigo-100 mb-2">Utilisateurs actifs</div>
            <div className="text-3xl font-bold text-white">{stats.activity.activeUsersLast30Days}</div>
          </div>
          <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white shadow-lg border border-violet-500 hover:shadow-xl transition-all duration-200">
            <div className="text-sm font-medium text-violet-100 mb-2">Projets créés</div>
            <div className="text-3xl font-bold text-white">{stats.activity.projectsCreatedLast30Days}</div>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-600 to-fuchsia-700 rounded-xl p-5 text-white shadow-lg border border-fuchsia-500 hover:shadow-xl transition-all duration-200">
            <div className="text-sm font-medium text-fuchsia-100 mb-2">Actions complétées</div>
            <div className="text-3xl font-bold text-white">{stats.activity.actionsCompletedLast30Days}</div>
          </div>
        </div>
      </div>

      {/* Répartitions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Langues */}
        <div className="bg-white rounded-xl shadow-md border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Globe className="h-4 w-4" />
            </div>
            Répartition par langue
          </h3>
          <div className="space-y-3">
            {stats.distributions.usersByLanguage.map((item, index) => {
              const colors = ["bg-indigo-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-fuchsia-500"];
              const bgColor = colors[index % colors.length];
              return (
                <div key={item.language} className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/50 transition-colors">
                  <span className="text-indigo-800 font-medium">{item.language}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                    <span className="font-bold text-indigo-900">{item.count}</span>
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
                <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-violet-50/50 transition-colors">
                  <span className="text-violet-800 font-medium">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                    <span className="font-bold text-violet-900">{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statuts des actions */}
        <div className="bg-white rounded-xl shadow-md border border-fuchsia-200 p-6">
          <h3 className="text-lg font-semibold text-fuchsia-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-fuchsia-600 text-white">
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
                <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-fuchsia-50/50 transition-colors">
                  <span className="text-fuchsia-800 font-medium">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                    <span className="font-bold text-fuchsia-900">{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inscriptions par mois */}
      {Object.keys(stats.registrations.byMonth).length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
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
                      <span className="text-indigo-800 font-medium">
                        {new Date(month + "-01").toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                      </span>
                      <span className="font-bold text-indigo-600">{count}</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
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

      {/* Statistiques de vues */}
      {stats.analytics && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-indigo-200 p-6">
            <h2 className="text-xl font-semibold text-indigo-900 mb-6 flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              Statistiques de vues (30 derniers jours)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<Eye className="h-5 w-5" />}
                label="Vues totales"
                value={stats.analytics.overview.totalViews}
                color="blue"
              />
              <StatCard
                icon={<User className="h-5 w-5" />}
                label="Visiteurs uniques"
                value={stats.analytics.overview.uniqueVisitors}
                color="green"
              />
              <StatCard
                icon={<Globe className="h-5 w-5" />}
                label="Vues anonymes"
                value={stats.analytics.overview.anonymousViews}
                color="purple"
              />
            </div>

            {/* Pages les plus visitées */}
            {stats.analytics.topPages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Pages les plus visitées</h3>
                <div className="space-y-2">
                  {stats.analytics.topPages.map((page, index) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-600 font-medium w-6">{index + 1}.</span>
                        <span className="text-indigo-900 font-medium">{page.path}</span>
                      </div>
                      <span className="text-indigo-700 font-semibold">{page.count} vues</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Utilisateurs les plus actifs */}
            {stats.analytics.viewsByUser.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Utilisateurs les plus actifs</h3>
                <div className="space-y-2">
                  {stats.analytics.viewsByUser.slice(0, 10).map((user, index) => (
                    <div
                      key={user.userId || `anonymous-${index}`}
                      className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-600 font-medium w-6">{index + 1}.</span>
                        <div>
                          <span className="text-indigo-900 font-medium block">{user.userName}</span>
                          {user.userEmail && (
                            <span className="text-indigo-600 text-sm">{user.userEmail}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-indigo-700 font-semibold">{user.count} vues</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </TabsContent>
    </Tabs>
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
      gradient: "from-indigo-500 to-indigo-600",
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      iconBg: "bg-indigo-600",
      text: "text-indigo-700",
      border: "border-indigo-200",
      value: "text-indigo-900",
    },
    purple: {
      gradient: "from-violet-500 to-violet-600",
      bg: "bg-gradient-to-br from-violet-50 to-violet-100",
      iconBg: "bg-violet-600",
      text: "text-violet-700",
      border: "border-violet-200",
      value: "text-violet-900",
    },
    green: {
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-600",
      text: "text-emerald-700",
      border: "border-emerald-200",
      value: "text-emerald-900",
    },
    orange: {
      gradient: "from-amber-500 to-amber-600",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100",
      iconBg: "bg-amber-600",
      text: "text-amber-700",
      border: "border-amber-200",
      value: "text-amber-900",
    },
    pink: {
      gradient: "from-fuchsia-500 to-fuchsia-600",
      bg: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100",
      iconBg: "bg-fuchsia-600",
      text: "text-fuchsia-700",
      border: "border-fuchsia-200",
      value: "text-fuchsia-900",
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

