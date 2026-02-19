/**
 * Page Projet > Vue d'ensemble
 * Refactor UI/UX uniquement — aucune modification de logique, API ou modèles.
 * Changements : header hero (Card), KPIs sémantiques, layout 2 colonnes (main: Actions+Réunion | secondaire: Bloq+Activité),
 * navigation segmented control, fond muted, hovers doux, boutons primary/secondary.
 */
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SectionTitle } from "@/components/ui/section-title";
import { Plus, Calendar, Users, CheckSquare, CalendarDays, AlertCircle, AlertTriangle, FolderKanban, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProjectStats } from "@/components/projects/project-stats";
import { ProjectActivity } from "@/components/projects/project-activity";
import { formatShortDate, isOverdue } from "@/lib/timeUrgency";
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
  const StatusIcon = projectStatus.variant === "destructive" ? AlertTriangle : AlertCircle;

  return (
    <div className="relative min-h-[50vh] bg-slate-50/50 dark:bg-slate-950/30 pb-8 sm:pb-12">
      {/* Fond décoratif léger — gradient muted */}
      <div className="absolute inset-0 -top-8 -left-4 -right-4 h-40 sm:h-52 bg-gradient-to-br from-slate-100/80 via-transparent to-slate-100/60 dark:from-slate-900/40 dark:via-transparent dark:to-slate-900/30 rounded-2xl pointer-events-none" aria-hidden />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--accent-projets)_/_.04)] dark:bg-[hsl(var(--accent-projets)_/_.06)] rounded-full blur-3xl pointer-events-none" aria-hidden />

      <div className="relative space-y-8 sm:space-y-10 px-1">
        {/* Navigation — segmented control */}
        <ProjectNavigation projectId={project.id} />

        {/* Header Hero — titre, badge signal (icône+couleur), méta, action bar alignée à droite */}
        <div className="animate-in fade-in duration-500">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-10">
                <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm bg-[hsl(var(--accent-projets)_/_.12)] dark:bg-[hsl(var(--accent-projets)_/_.2)]">
                    <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7 text-[hsl(var(--accent-projets))]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                        {project.name}
                      </h1>
                      {projectStatus.label !== "On track" && (
                        <Chip variant={projectStatus.variant === "destructive" ? "danger" : "warning"} size="sm" className="font-medium inline-flex items-center gap-1.5">
                          <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                          {projectStatus.label}
                        </Chip>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                        {project.description}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground/90 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      Créé le {new Date(project.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {/* Action bar — alignée à droite, espacée */}
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0 lg:border-l lg:border-slate-200/80 dark:lg:border-slate-700/60 lg:pl-8">
                  <Button asChild size="default" className="shadow-sm font-medium">
                    <Link href={`/app/meetings/new?projectId=${project.id}`} className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Réunion
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="default" className="font-medium">
                    <Link href={`/app/actions/new?projectId=${project.id}`} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
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
            </div>
          </div>
        </div>

        {/* KPIs — ProjectStats (mêmes données, rendu amélioré) */}
        <ProjectStats
          openActions={openActions}
          decisions={project.decisions.length}
          meetings={userMeetings.length}
          pointsToClarify={pointsToClarify}
        />

        {/* Contenu — 2 colonnes : principale (Actions + Réunion) | secondaire (Bloquants + Activité) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Actions de la semaine — carte principale mise en avant */}
          <FlowCard variant="default" className="rounded-2xl border-l-4 border-l-[hsl(var(--accent-actions))] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 shadow-md p-6 sm:p-8">
            <FlowCardContent className="space-y-4 sm:space-y-6 p-0">
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
                  <Link href={`/app/actions?projectId=${project.id}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
                    Voir tout →
                  </Link>
                )}
              </div>
              {thisWeekActions.length === 0 ? (
                <div className="py-14 sm:py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-slate-100 dark:bg-slate-800/60">
                    <Sparkles className="h-7 w-7 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Aucune action cette semaine. Tout est à jour.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {thisWeekActions.map((action: { id: string; title: string; status: string; dueDate: Date | null }) => {
                    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now);
                    
                    return (
                      <Link
                        key={action.id}
                        href={`/app/projects/${project.id}/kanban?actionId=${action.id}`}
                        className="block group"
                      >
                        <div className="rounded-xl p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:border-slate-300/80 dark:hover:border-slate-600/50 hover:shadow-sm transition-all duration-200 ease-out">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-[hsl(var(--accent-actions)_/_.15)] dark:bg-[hsl(var(--accent-actions)_/_.25)]">
                              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(var(--accent-actions))]" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors duration-200 ease-out leading-snug mb-1.5 ${
                                action.status === "DONE" ? "line-through text-muted-foreground" : ""
                              }`}>
                                {action.title}
                              </h4>
                              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                                {action.dueDate && (
                                  <>
                                    <span className="flex items-center gap-1 sm:gap-1.5 font-medium">
                                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
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
                      </Link>
                    );
                  })}
                </div>
              )}
            </FlowCardContent>
          </FlowCard>

          {/* Dernière réunion — dans colonne principale */}
          <FlowCard variant="default" className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 shadow-sm p-6 sm:p-8">
            <FlowCardContent className="space-y-4 sm:space-y-6 p-0">
              <SectionTitle
                title="Dernière réunion"
                subtitle="Réunion la plus récente liée à ce projet"
                size="md"
                accentColor="blue"
                icon={<CalendarDays className="h-4 w-4" />}
              />
              {userMeetings.length === 0 ? (
                <div className="py-12 sm:py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-slate-100 dark:bg-slate-800/60">
                    <CalendarDays className="h-7 w-7 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">
                    Aucune réunion enregistrée
                  </p>
                  <Link href={`/app/meetings/new?projectId=${project.id}`}>
                    <Button size="default" variant="outline" className="font-medium">
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une réunion
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <Link href={`/app/meetings/${userMeetings[0].id}/analyze`} className="block group">
                    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-100/90 dark:hover:bg-slate-800/60 hover:shadow-sm transition-all duration-200 ease-out">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        <CalendarDays className="h-5 w-5" strokeWidth={1.5} />
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
                    <Button size="default" className="w-full font-medium">
                      Analyser / Ouvrir
                    </Button>
                  </Link>
                </div>
              )}
            </FlowCardContent>
          </FlowCard>
        </div>

        {/* Colonne secondaire — Points bloquants + Activité récente */}
        <div className="space-y-6 sm:space-y-8">
          {/* Points bloquants — urgence renforcée, bouton visible */}
          {blockedActions > 0 && (
            <FlowCard variant="default" className="rounded-2xl border-2 border-amber-300/70 dark:border-amber-600/50 bg-white dark:bg-slate-900/50 shadow-sm p-6 sm:p-8 ring-1 ring-amber-200/30 dark:ring-amber-800/20">
              <FlowCardContent className="space-y-4 sm:space-y-6 p-0">
                <SectionTitle
                  title="Points bloquants"
                  subtitle="Actions nécessitant une intervention"
                  count={blockedActions}
                  size="md"
                  accentColor="red"
                  icon={<AlertCircle className="h-4 w-4" />}
                />
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-200/80 dark:border-amber-700/50">
                    <p className="text-sm sm:text-base font-semibold text-foreground mb-1.5">
                      {blockedActions} action{blockedActions > 1 ? "s" : ""} bloquée{blockedActions > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Nécessitent une attention immédiate</p>
                  </div>
                  <Link href={`/app/actions?projectId=${project.id}&status=BLOCKED`}>
                    <Button size="default" className="w-full font-semibold bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white border-0 transition-colors duration-200">
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
    </div>
  );
}
