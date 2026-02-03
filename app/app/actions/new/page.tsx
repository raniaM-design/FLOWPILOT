import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle, FlowCardDescription } from "@/components/ui/flow-card";
import { PageHeader } from "@/components/ui/page-header";
import { createStandaloneAction } from "../actions";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ActionFormFields } from "@/components/action-form-fields";
import { ProjectSelect } from "./project-select";
import { getTranslations } from "@/i18n/request";
import { FormSubmitButton } from "@/components/forms/form-submit-button";

export default async function NewActionPage() {
  const t = await getTranslations();
  const userId = await getCurrentUserIdOrThrow();

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

  if (projects.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container max-w-6xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <PageHeader
              title={t("actions.newAction")}
              subtitle={t("actions.newActionSubtitle")}
            />
            <FlowCard variant="default">
              <FlowCardContent className="py-12 text-center">
                <p className="text-base font-semibold text-foreground mb-2">
                  {t("emptyStates.noProjectAvailable")}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("emptyStates.mustCreateProject")}
                </p>
                <Link href="/app/projects/new">
                  <Button>
                    {t("forms.createProject")}
                  </Button>
                </Link>
              </FlowCardContent>
            </FlowCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <PageHeader
            title={t("actions.newAction")}
            subtitle={t("actions.newActionSubtitle")}
            actions={[
              {
                label: t("common.cancel"),
                href: "/app/actions",
                variant: "outline",
              },
            ]}
          />

          <FlowCard className="bg-white border-slate-200/60 shadow-sm">
            <FlowCardHeader>
              <FlowCardTitle className="text-lg font-semibold tracking-tight">
                {t("actions.actionDetails")}
              </FlowCardTitle>
              <FlowCardDescription>
                {t("actions.actionDetailsDescription")}
              </FlowCardDescription>
            </FlowCardHeader>
            <FlowCardContent>
              <form action={createStandaloneAction} className="space-y-6">
                <ProjectSelect projects={projects} />

                <ActionFormFields />

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <FormSubmitButton
                    className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium"
                    loadingText={t("actions.creating") || "Création..."}
                  >
                    {t("actions.createAction")}
                  </FormSubmitButton>
                  <Link href="/app/actions">
                    <Button type="button" variant="outline">
                      {t("common.cancel")}
                    </Button>
                  </Link>
                </div>
              </form>
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
