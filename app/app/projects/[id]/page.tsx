import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SectionTitle } from "@/components/ui/section-title";
import { Plus, Calendar, Users, ListTodo, CheckSquare, CalendarDays, AlertCircle, FolderKanban, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProjectStats } from "@/components/projects/project-stats";
import { ProjectActivity } from "@/components/projects/project-activity";
import { formatShortDate, isOverdue, getDueMeta } from "@/lib/timeUrgency";
import { getActionStatusLabel } from "@/lib/utils/action-status";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { ProjectNavigation } from "./project-navigation";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  // Vérifier l'accès au projet
  const hasAccess = await canAccessProject(userId, id);
  if (!hasAccess) {
    notFound();
  }

  // Charger le projet avec toutes les données nécessaires
  const project = await prisma.project.findFirst({
    where: {
      id,
    },
    include: {
      decisions: {
        include: {
          actions: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      actions: {
        where: {
          assigneeId: userId,
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 10,
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Récupérer les meetings liés à ce projet
  const userMeetings = await prisma.meeting.findMany({
    where: {
      ownerId: userId,
      projectId: id, // Filtrer par projet lié directement à la réunion
    },
    orderBy: {
      date: "desc",
    },
    take: 5,
  });

  // Calculer les stats
  const openActions = project.actions.filter((a: { status: string }) => a.status !== "DONE").length;
  const blockedActions = project.actions.filter((a: { status: string }) => a.status === "BLOCKED").length;
  const overdueActions = project.actions.filter((a: { status: string; dueDate: Date | null }) => 
    a.status !== "DONE" && a.dueDate && isOverdue(a.dueDate, a.status as "TODO" | "DOING" | "DONE" | "BLOCKED", new Date())
  ).length;

  // Actions à faire cette semaine
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const thisWeekActions = project.actions
    .filter((a) => {
      if (a.status === "DONE") return false;
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= now && dueDate <= nextWeek;
    })
    .slice(0, 5);

  // Activité récente (décisions récentes, meetings récents)
  const recentDecisions = project.decisions
    .slice(0, 3)
    .map((d: { id: string; title: string; createdAt: Date }) => ({
      id: d.id,
      type: "decision" as const,
      title: d.title,
      date: d.createdAt,
      href: `/app/decisions/${d.id}`,
    }));

  const recentMeetings = userMeetings.map((m: { id: string; title: string; date: Date }) => ({
    id: m.id,
    type: "meeting" as const,
    title: m.title,
    date: m.date,
    href: `/app/meetings/${m.id}/analyze`,
  }));

  const activityItems = [...recentMeetings, ...recentDecisions]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  // Points à clarifier (placeholder pour l'instant)
  const pointsToClarify = 0;

  // Statut du projet (calculé basiquement)
  const getProjectStatusBadge = () => {
    if (overdueActions > 0) {
      return { label: "En retard", variant: "destructive" as const };
    }
    if (blockedActions > 0) {
      return { label: "À risque", variant: "default" as const };
    }
    return { label: "On track", variant: "secondary" as const };
  };

  const projectStatus = getProjectStatusBadge();

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Navigation */}
      <ProjectNavigation projectId={project.id} />

      {/* Header Projet Premium */}
      <div className="space-y-4 sm:space-y-6">
        {/* Titre avec icône et badge */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--accent-projets) / 0.15)' }}>
              <FolderKanban className="h-5 w-5 sm:h-7 sm:w-7" style={{ color: 'hsl(var(--accent-projets))' }} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">
                  {project.name}
                </h1>
                {projectStatus.label !== "On track" && (
                  <Chip variant={projectStatus.variant === "destructive" ? "danger" : "warning"} size="sm" className="font-normal text-xs sm:text-sm">
                    {projectStatus.label}
                  </Chip>
                )}
              </div>
              {project.description && (
                <p className="text-sm sm:text-base text-text-secondary mt-1.5 sm:mt-2 leading-relaxed max-w-3xl">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-text-secondary">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Créé le {new Date(project.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <Button asChild variant="default" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
              <Link href={`/app/meetings/new?projectId=${project.id}`}>
                <Users className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Réunion
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
              <Link href={`/app/actions/new?projectId=${project.id}`}>
                <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Action
              </Link>
            </Button>
            <EntityActionsMenu
              entityType="project"
              entityId={project.id}
              entityLabel={project.name}
              redirectTo="/app/projects"
            />
          </div>
        </div>

        {/* Stats toujours visibles mais plus élégantes */}
        <ProjectStats
          openActions={openActions}
          decisions={project.decisions.length}
          meetings={userMeetings.length}
          pointsToClarify={pointsToClarify}
        />
      </div>

      {/* Contenu principal en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Colonne gauche (large) */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Actions de la semaine */}
          <FlowCard variant="elevated">
            <FlowCardContent className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <SectionTitle
                  title="Actions de la semaine"
                  subtitle="Actions avec échéance dans les 7 prochains jours"
                  count={thisWeekActions.length}
                  size="md"
                  accentColor="blue"
                  icon={<Calendar className="h-4 w-4" />}
                />
                {thisWeekActions.length > 0 && (
                  <Link href={`/app/actions?projectId=${project.id}`} className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors duration-150 font-medium">
                    Voir tout →
                  </Link>
                )}
              </div>
              {thisWeekActions.length === 0 ? (
                <div className="py-12 sm:py-20 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: 'hsl(var(--accent) / 0.3)' }}>
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: 'hsl(var(--primary) / 0.7)' }} strokeWidth={1.5} />
                  </div>
                  <p className="text-xs sm:text-sm font-normal text-text-secondary leading-relaxed max-w-md mx-auto">
                    Aucune action cette semaine. Tout est à jour.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {thisWeekActions.map((action: { id: string; title: string; status: string; dueDate: Date | null }) => {
                    const dueMeta = getDueMeta(action.dueDate, now);
                    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now);
                    
                    return (
                      <Link
                        key={action.id}
                        href={`/app/projects/${project.id}/kanban?actionId=${action.id}`}
                        className="block group"
                      >
                        <div className="bg-section-bg/50 rounded-xl shadow-premium p-4 sm:p-6 hover:bg-hover-bg/90 transition-all duration-200 ease-out border border-transparent hover:border-border/50">
                          <div className="flex items-start justify-between gap-4 sm:gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 sm:gap-4 mb-2 sm:mb-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--accent-actions) / 0.2)' }}>
                                  <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'hsl(var(--accent-actions))' }} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium text-sm sm:text-base text-foreground group-hover:text-primary transition-colors duration-200 ease-out leading-relaxed mb-2 sm:mb-2.5 ${
                                    action.status === "DONE" ? "line-through text-muted-foreground" : ""
                                  }`}>
                                    {action.title}
                                  </h4>
                                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                                    {action.dueDate && (
                                      <>
                                        <span className="flex items-center gap-1 sm:gap-1.5 font-normal">
                                          <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                          {formatShortDate(action.dueDate)}
                                        </span>
                                        {overdue && (
                                          <>
                                            <span className="text-border/50">•</span>
                                            <Chip variant="danger" size="sm" className="font-normal text-[10px] sm:text-xs">En retard</Chip>
                                          </>
                                        )}
                                      </>
                                    )}
                                    {action.status !== "DONE" && (
                                      <>
                                        {action.dueDate && <span className="text-border/50">•</span>}
                                        <Chip
                                          variant={
                                            action.status === "BLOCKED"
                                              ? "danger"
                                              : "neutral"
                                          }
                                          size="sm"
                                          className="font-normal text-[10px] sm:text-xs"
                                        >
                                          {getActionStatusLabel(action.status)}
                                        </Chip>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </FlowCardContent>
          </FlowCard>
        </div>

        {/* Colonne droite (étroite) */}
        <div className="space-y-6 sm:space-y-8">
          {/* Dernière réunion */}
          <FlowCard variant="default">
            <FlowCardContent className="space-y-4 sm:space-y-6">
              <SectionTitle
                title="Dernière réunion"
                subtitle="Réunion la plus récente liée à ce projet"
                size="md"
                accentColor="blue"
                icon={<CalendarDays className="h-4 w-4" />}
              />
              {userMeetings.length === 0 ? (
                <div className="py-12 sm:py-16 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: 'hsl(var(--accent) / 0.3)' }}>
                    <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: 'hsl(var(--primary) / 0.7)' }} strokeWidth={1.5} />
                  </div>
                  <p className="text-xs sm:text-sm font-normal text-text-secondary leading-relaxed mb-4 sm:mb-5">
                    Aucune réunion enregistrée
                  </p>
                  <Link href={`/app/meetings/new?projectId=${project.id}`}>
                    <Button size="sm" variant="outline" className="font-medium text-xs sm:text-sm">
                      <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Créer une réunion
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <Link href={`/app/meetings/${userMeetings[0].id}/analyze`} className="block group">
                    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-section-bg/50 hover:bg-hover-bg/80 transition-all duration-200 ease-out border border-transparent hover:border-border/50">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--accent) / 0.4)' }}>
                        <CalendarDays className="h-4.5 w-4.5 sm:h-5 sm:w-5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5 leading-relaxed group-hover:text-primary transition-colors duration-150">
                          {userMeetings[0].title}
                        </p>
                        <p className="text-[10px] sm:text-xs text-text-secondary">
                          {formatShortDate(userMeetings[0].date)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Link href={`/app/meetings/${userMeetings[0].id}/analyze`}>
                    <Button size="sm" className="w-full font-medium text-xs sm:text-sm">
                      Analyser / Ouvrir
                    </Button>
                  </Link>
                </div>
              )}
            </FlowCardContent>
          </FlowCard>

          {/* Points bloquants */}
          {blockedActions > 0 && (
            <FlowCard variant="default">
              <FlowCardContent className="space-y-4 sm:space-y-6">
                <SectionTitle
                  title="Points bloquants"
                  subtitle="Actions nécessitant une intervention"
                  count={blockedActions}
                  size="md"
                  accentColor="red"
                  icon={<AlertCircle className="h-4 w-4" />}
                />
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-4 sm:p-5 rounded-xl bg-section-bg/50 border border-border/30">
                    <p className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                      {blockedActions} action{blockedActions > 1 ? "s" : ""} bloquée{blockedActions > 1 ? "s" : ""}
                    </p>
                    <p className="text-[10px] sm:text-xs text-text-secondary leading-relaxed">Nécessitent une attention</p>
                  </div>
                  <Link href={`/app/actions?projectId=${project.id}&status=BLOCKED`}>
                    <Button size="sm" variant="outline" className="w-full font-medium text-xs sm:text-sm">
                      Voir détails →
                    </Button>
                  </Link>
                </div>
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Activité récente */}
          <ProjectActivity items={activityItems} projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
