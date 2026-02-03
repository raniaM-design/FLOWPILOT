"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Users, Plus, Calendar, FileText, CheckSquare2, Columns3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  email: string;
  isCompanyAdmin: boolean;
}

interface CompanyStats {
  projects: number;
  actions: {
    todo: number;
    doing: number;
    blocked: number;
    done: number;
  };
  decisions: number;
  meetings: number;
  recentActions: Array<{
    id: string;
    title: string;
    status: string;
    assigneeEmail: string;
    projectName: string;
  }>;
  recentDecisions: Array<{
    id: string;
    title: string;
    status: string;
    projectName: string;
  }>;
  recentMeetings: Array<{
    id: string;
    title: string;
    date: Date;
    projectName: string;
  }>;
}

interface TeamSpaceSectionProps {
  companyName: string;
  members: TeamMember[];
  isCompanyAdmin: boolean;
  stats: CompanyStats;
}

export function TeamSpaceSection({ companyName, members, isCompanyAdmin, stats }: TeamSpaceSectionProps) {
  const [activeTab, setActiveTab] = useState("board");

  // Mini board columns avec vraies données
  const boardColumns = [
    { id: "TODO", label: "À faire", color: "slate", count: stats.actions.todo },
    { id: "DOING", label: "En cours", color: "blue", count: stats.actions.doing },
    { id: "BLOCKED", label: "Bloqué", color: "amber", count: stats.actions.blocked },
    { id: "DONE", label: "Terminé", color: "emerald", count: stats.actions.done },
  ];

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-slate-100 text-slate-700";
      case "DOING":
        return "bg-blue-100 text-blue-700";
      case "BLOCKED":
        return "bg-amber-100 text-amber-700";
      case "DONE":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <FlowCard className="bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 border-blue-100/60">
      <FlowCardContent className="p-6 md:p-8">
        {/* Team Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{companyName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((member) => (
                    <Avatar key={member.id} className="border-2 border-white w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                        {getInitials(member.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">+{members.length - 4}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-600">{members.length} membre{members.length > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          {isCompanyAdmin && (
            <Link href="/app/company">
              <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50">
                <Users className="h-4 w-4 mr-2" />
                Inviter
              </Button>
            </Link>
          )}
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-2xl font-bold text-slate-900">{stats.projects}</div>
            <div className="text-xs text-slate-600 mt-1">Projets</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-2xl font-bold text-slate-900">{stats.decisions}</div>
            <div className="text-xs text-slate-600 mt-1">Décisions</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-2xl font-bold text-slate-900">{stats.meetings}</div>
            <div className="text-xs text-slate-600 mt-1">Réunions</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-2xl font-bold text-slate-900">
              {stats.actions.todo + stats.actions.doing + stats.actions.blocked}
            </div>
            <div className="text-xs text-slate-600 mt-1">Actions ouvertes</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Réunions</span>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Décisions</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <CheckSquare2 className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>

          {/* Board Tab */}
          <TabsContent value="board" className="mt-0">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {boardColumns.map((column) => {
                  const columnActions = stats.recentActions.filter((a) => a.status === column.id);
                  return (
                    <div
                      key={column.id}
                      className="flex-shrink-0 w-64 bg-slate-50/50 rounded-xl border border-slate-200/60 p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-900">{column.label}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {column.count}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {columnActions.slice(0, 5).map((action) => (
                          <Link
                            key={action.id}
                            href={`/app/actions?actionId=${action.id}`}
                            className="block bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow"
                          >
                            <p className="text-sm font-medium text-slate-900 mb-2 line-clamp-2">{action.title}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className={`${getStatusColor(action.status)} text-xs`}>
                                    {getInitials(action.assigneeEmail)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-slate-600">{action.assigneeEmail.split("@")[0]}</span>
                              </div>
                              <span className="text-xs text-slate-500">{action.projectName}</span>
                            </div>
                          </Link>
                        ))}
                        {columnActions.length === 0 && (
                          <div className="text-center py-8 text-sm text-slate-500">Aucune action</div>
                        )}
                        {columnActions.length > 5 && (
                          <Link
                            href={`/app/actions?status=${column.id.toLowerCase()}`}
                            className="block text-center text-xs text-blue-600 hover:text-blue-700 mt-2"
                          >
                            Voir tout ({column.count})
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="mt-0">
            {stats.recentMeetings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-sm">Aucune réunion partagée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentMeetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/app/meetings/${meeting.id}`}
                    className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-900 mb-1">{meeting.title}</h3>
                        <p className="text-xs text-slate-600">{meeting.projectName}</p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(meeting.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/app/meetings"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4"
                >
                  Voir toutes les réunions
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="mt-0">
            {stats.recentDecisions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-sm">Aucune décision partagée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentDecisions.map((decision) => (
                  <Link
                    key={decision.id}
                    href={`/app/decisions/${decision.id}`}
                    className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-900 mb-1">{decision.title}</h3>
                        <p className="text-xs text-slate-600">{decision.projectName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {decision.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/app/decisions"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4"
                >
                  Voir toutes les décisions
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="mt-0">
            {stats.recentActions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckSquare2 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-sm">Aucune action partagée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActions.map((action) => (
                  <Link
                    key={action.id}
                    href={`/app/actions?actionId=${action.id}`}
                    className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-900 mb-1">{action.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>{action.projectName}</span>
                          <span>•</span>
                          <span>{action.assigneeEmail.split("@")[0]}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(action.status)}`}>
                        {action.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/app/actions"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4"
                >
                  Voir toutes les actions
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </FlowCardContent>
    </FlowCard>
  );
}
