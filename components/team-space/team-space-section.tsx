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

interface TeamSpaceSectionProps {
  companyName: string;
  members: TeamMember[];
  isCompanyAdmin: boolean;
}

export function TeamSpaceSection({ companyName, members, isCompanyAdmin }: TeamSpaceSectionProps) {
  const [activeTab, setActiveTab] = useState("board");

  // Mini board columns (exemple de données)
  const boardColumns = [
    { id: "todo", label: "À faire", color: "slate" },
    { id: "doing", label: "En cours", color: "blue" },
    { id: "review", label: "En revue", color: "amber" },
    { id: "done", label: "Terminé", color: "emerald" },
  ];

  // Exemple de cartes (à remplacer par de vraies données)
  const exampleCards = [
    { id: "1", title: "Action exemple", status: "todo", assignee: members[0]?.email || "user@example.com" },
    { id: "2", title: "Décision à valider", status: "review", assignee: members[1]?.email || "user2@example.com" },
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
                {boardColumns.map((column) => (
                  <div
                    key={column.id}
                    className="flex-shrink-0 w-64 bg-slate-50/50 rounded-xl border border-slate-200/60 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">{column.label}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {column.id === "todo" ? exampleCards.length : 0}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {exampleCards
                        .filter((card) => card.status === column.id)
                        .map((card) => (
                          <div
                            key={card.id}
                            className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow"
                          >
                            <p className="text-sm font-medium text-slate-900 mb-2">{card.title}</p>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                  {getInitials(card.assignee)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-slate-600">{card.assignee.split("@")[0]}</span>
                            </div>
                          </div>
                        ))}
                      {column.id === "todo" && exampleCards.filter((card) => card.status === column.id).length === 0 && (
                        <div className="text-center py-8 text-sm text-slate-500">
                          Aucune carte
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="mt-0">
            <div className="text-center py-12 text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-sm">Aucune réunion partagée</p>
            </div>
          </TabsContent>

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="mt-0">
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-sm">Aucune décision partagée</p>
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="mt-0">
            <div className="text-center py-12 text-slate-500">
              <CheckSquare2 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-sm">Aucune action partagée</p>
            </div>
          </TabsContent>
        </Tabs>
      </FlowCardContent>
    </FlowCard>
  );
}

