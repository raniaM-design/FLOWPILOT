"use client";

import { Building2, Users, Calendar, CheckSquare2, AlertTriangle, ArrowRight, Settings, Mail, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function CompanyPageContent({ company, stats, isCompanyAdmin }: CompanyPageContentProps) {
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

  return (
    <div className="space-y-6">
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
                  <Button size="sm" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-lg shadow-blue-500/25" asChild>
                    <Link href="/app/company?tab=invite">
                      <Mail className="h-4 w-4 mr-2" />
                      Inviter
                    </Link>
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

      {/* Section Membres */}
      {company && company.members.length > 0 && (
        <Card className="border-purple-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Membres ({company.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {company.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-gradient-to-r from-purple-50/50 to-transparent hover:from-purple-100/50 hover:to-purple-50/30 border border-purple-100/50 transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.email}</p>
                      {member.role && (
                        <p className="text-xs text-slate-600">{member.role}</p>
                      )}
                    </div>
                  </div>
                  {member.isCompanyAdmin && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-sm">
                      Admin
                    </Badge>
                  )}
                </div>
              ))}
            </div>
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

