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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Membres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.memberCount}</div>
            <p className="text-xs text-slate-500 mt-1">Total entreprise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Projets actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.activeProjectsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Accessibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Réunions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.meetingsThisMonth}</div>
            <p className="text-xs text-slate-500 mt-1">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Actions en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.actionsInProgress}</span>
              {stats.overdueActions > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.overdueActions} en retard
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Accessibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Card Entreprise */}
      {company && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-slate-600" />
                  {company.name}
                </CardTitle>
                {company.domain && (
                  <CardDescription className="mt-1">{company.domain}</CardDescription>
                )}
              </div>
              {isCompanyAdmin && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600" />
              Membres ({company.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {company.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.email}</p>
                      {member.role && (
                        <p className="text-xs text-slate-500">{member.role}</p>
                      )}
                    </div>
                  </div>
                  {member.isCompanyAdmin && (
                    <Badge variant="secondary" className="text-xs">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare2 className="h-5 w-5 text-slate-600" />
              Projets en cours ({stats.projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{project.actionsInProgress} actions en cours</span>
                      {project.decisionsCount > 0 && (
                        <span>{project.decisionsCount} décisions</span>
                      )}
                      {project.nextDueDate && (
                        <span className="text-slate-500">
                          Prochaine échéance: {formatDate(project.nextDueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
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

