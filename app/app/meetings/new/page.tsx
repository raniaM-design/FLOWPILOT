import { PageHeader } from "@/components/ui/page-header";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle, FlowCardDescription } from "@/components/ui/flow-card";
import { createMeeting } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { FileText, Calendar, Users, Link as LinkIcon, Sparkles } from "lucide-react";
import { MeetingEditorWithImport, ImportMeetingButton } from "@/components/meetings/meeting-editor-with-import";
import { getTranslations } from "@/i18n/request";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { ProjectSelect } from "@/app/app/actions/new/project-select";
import { FormSubmitButton } from "@/components/forms/form-submit-button";

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const t = await getTranslations();
  const userId = await getCurrentUserIdOrThrow();

  const params = await searchParams;
  const defaultProjectId = params.projectId || undefined;

  // Récupérer les projets de l'utilisateur
  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
      status: {
        not: "DONE", // Exclure les projets terminés
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Date par défaut = aujourd'hui
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-7xl mx-auto px-8 py-10">
        <div className="space-y-10">
          <PageHeader
            title={t("meetings.newMeeting")}
            subtitle={t("meetings.notesDescription")}
            actions={[
              {
                label: t("common.cancel"),
                href: "/app/meetings",
                variant: "outline",
              },
            ]}
          />

          <form action={createMeeting} className="space-y-8">
            {/* Détails en haut */}
            <FlowCard className="bg-white border-slate-200/60 shadow-sm">
              <FlowCardHeader>
                <FlowCardTitle className="text-lg font-semibold tracking-tight">
                  Détails
                </FlowCardTitle>
              </FlowCardHeader>
              <FlowCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm text-muted-foreground">
                      {t("meetings.titleLabel")} *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Ex: Réunion produit - Q1 2024"
                      required
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm text-muted-foreground">
                      {t("meetings.dateLabel")} *
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={today}
                      required
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="participants" className="text-sm text-muted-foreground">
                      {t("meetings.participantsLabel")} <span className="text-xs">(optionnel)</span>
                    </Label>
                    <Input
                      id="participants"
                      name="participants"
                      placeholder="Ex: Jean Dupont, Marie Martin"
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <ProjectSelect projects={projects} defaultValue={defaultProjectId} />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-sm text-muted-foreground">
                      {t("meetings.contextLabel")} <span className="text-xs">(optionnel)</span>
                    </Label>
                    <Input
                      id="context"
                      name="context"
                      placeholder="Ex: Client XYZ / Contexte additionnel"
                      className="bg-white"
                    />
                  </div>
                </div>
              </FlowCardContent>
            </FlowCard>

            {/* Éditeur en dessous */}
            <FlowCard className="bg-white border-slate-200/60 shadow-sm">
              <FlowCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <FlowCardTitle className="text-xl font-semibold tracking-tight">
                      {t("meetings.notesLabel")} *
                    </FlowCardTitle>
                    <FlowCardDescription>
                      {t("meetings.notesDescription")}
                    </FlowCardDescription>
                  </div>
                  <ImportMeetingButton />
                </div>
              </FlowCardHeader>
              <FlowCardContent className="p-0">
                <MeetingEditorWithImport
                  id="raw_notes"
                  name="raw_notes"
                  placeholder={t("meetings.notesPlaceholder")}
                  required
                />
              </FlowCardContent>
            </FlowCard>

            {/* Actions en bas */}
            <div className="flex gap-3 pt-4">
              <FormSubmitButton
                className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium px-8"
                loadingText="Création..."
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t("meetings.create")}
              </FormSubmitButton>
              <Link href="/app/meetings">
                <Button type="button" variant="outline">
                  {t("common.cancel")}
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

