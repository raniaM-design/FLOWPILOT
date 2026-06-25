import { prisma } from "@/lib/db";
import {
  DEMO_ONBOARDING_STEPS,
  DEMO_USER_EMAIL,
} from "@/lib/demo/constants";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

const DEMO_MEETING_NOTES = `## Réunion produit — Projet Alpha

### Présents
Sophie Dupont, Marc Lefebvre, Julie Bernard

### Contexte
Point hebdomadaire sur l'avancement du MVP et la préparation du comité de direction.

### Décisions
- Valider le périmètre MVP pour fin mars — on coupe l'export PPT de la V1
- Reporter la fonctionnalité board collaboratif à la V2

### Actions
- Sophie : préparer le comité de direction avec les KPIs Q1 — avant le 12 février
- Marc : finaliser les maquettes onboarding — avant le 8 février
- Julie : lancer la campagne Q2 — avant le 4 février (urgent)

### Points à clarifier
- Budget media Q2 à valider avec la direction
`;

const DEMO_ANALYSIS_JSON = JSON.stringify({
  decisions: [
    {
      decision: "Valider le périmètre MVP pour fin mars",
      contexte: "Export PPT reporté à la V2 pour tenir la date de livraison",
      impact_potentiel: "Alignement équipe produit et réduction du scope",
    },
    {
      decision: "Reporter le board collaboratif à la V2",
      contexte: "Priorité au parcours onboarding et au suivi des actions",
      impact_potentiel: "Focus sur la valeur cœur PILOTYS",
    },
  ],
  actions: [
    {
      action: "Préparer le comité de direction avec les KPIs Q1",
      responsable: "Sophie Dupont",
      echeance: "12 février",
    },
    {
      action: "Finaliser les maquettes onboarding",
      responsable: "Marc Lefebvre",
      echeance: "8 février",
    },
    {
      action: "Lancer la campagne Q2",
      responsable: "Julie Bernard",
      echeance: "4 février",
    },
  ],
  points_a_clarifier: ["Budget media Q2 à valider avec la direction"],
  points_a_venir: ["Revue du planning V2 après le comité"],
});

export async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: "Sophie Dupont",
        plan: "team",
        preferredLanguage: "fr",
      },
    });
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      email: DEMO_USER_EMAIL,
      name: "Sophie Dupont",
      plan: "team",
      preferredLanguage: "fr",
      role: "USER",
    },
    select: { id: true },
  });

  return created.id;
}

async function completeOnboarding(userId: string) {
  await Promise.all(
    DEMO_ONBOARDING_STEPS.map((stepKey) =>
      prisma.onboardingStep.upsert({
        where: {
          userId_stepKey: { userId, stepKey },
        },
        create: {
          userId,
          stepKey,
          completed: true,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
      }),
    ),
  );
}

export async function resetAndSeedDemoData(userId: string) {
  await prisma.project.deleteMany({ where: { ownerId: userId } });
  await prisma.meeting.deleteMany({ where: { ownerId: userId } });

  const projectAlpha = await prisma.project.create({
    data: {
      ownerId: userId,
      name: "Projet Alpha",
      description: "Lancement produit Q2 — MVP et campagne go-to-market",
      client: "Interne",
      status: "ACTIVE",
    },
  });

  const projectInterne = await prisma.project.create({
    data: {
      ownerId: userId,
      name: "Interne",
      description: "Pilotage CODIR et revues mensuelles",
      status: "ACTIVE",
    },
  });

  const decisionBudget = await prisma.decision.create({
    data: {
      projectId: projectAlpha.id,
      createdById: userId,
      title: "Valider le budget Q2",
      context: "Comité de direction — arbitrage media vs produit",
      decision: "Budget validé avec réserve sur la ligne media",
      status: "DECIDED",
      createdAt: daysAgo(5),
    },
  });

  const decisionV2 = await prisma.decision.create({
    data: {
      projectId: projectAlpha.id,
      createdById: userId,
      title: "Reporter la V2 au sprint suivant",
      context: "Réunion produit — charge équipe",
      status: "DRAFT",
      createdAt: daysAgo(2),
    },
  });

  const meetingDate = daysAgo(3);
  meetingDate.setHours(10, 0, 0, 0);

  await prisma.meeting.create({
    data: {
      ownerId: userId,
      projectId: projectAlpha.id,
      title: "Réunion produit",
      date: meetingDate,
      participants: "Sophie Dupont, Marc Lefebvre, Julie Bernard",
      context: "Projet Alpha",
      raw_notes: DEMO_MEETING_NOTES,
      notesTemplatePreset: "weekly_team",
      analysisJson: DEMO_ANALYSIS_JSON,
      analyzedAt: daysAgo(3),
    },
  });

  const comiteDate = daysFromNow(5);
  comiteDate.setHours(14, 0, 0, 0);

  await prisma.meeting.create({
    data: {
      ownerId: userId,
      projectId: projectInterne.id,
      title: "Comité de direction — Avril",
      date: comiteDate,
      participants: "Direction, Sophie Dupont",
      context: "Interne",
      raw_notes: "## Comité de direction\n\nOrdre du jour : revue Q1, arbitrages Q2.\n\n### Actions\n- Sophie : synthèse KPIs avant le comité",
      notesTemplatePreset: "board",
    },
  });

  await prisma.actionItem.createMany({
    data: [
      {
        projectId: projectAlpha.id,
        createdById: userId,
        assigneeId: userId,
        title: "Lancer la campagne Q2",
        description: "Brief media + calendrier editorial",
        status: "DOING",
        priority: "high",
        dueDate: daysAgo(1),
      },
      {
        projectId: projectAlpha.id,
        createdById: userId,
        assigneeId: userId,
        decisionId: decisionV2.id,
        title: "Valider le périmètre MVP",
        status: "TODO",
        priority: "high",
        dueDate: daysFromNow(4),
      },
      {
        projectId: projectAlpha.id,
        createdById: userId,
        assigneeId: userId,
        title: "Préparer le comité",
        status: "TODO",
        priority: "normal",
        dueDate: daysFromNow(8),
      },
      {
        projectId: projectInterne.id,
        createdById: userId,
        assigneeId: userId,
        decisionId: decisionBudget.id,
        title: "Synthèse KPIs Q1 pour le CODIR",
        status: "DOING",
        priority: "normal",
        dueDate: daysFromNow(3),
      },
      {
        projectId: projectAlpha.id,
        createdById: userId,
        assigneeId: userId,
        title: "Finaliser les maquettes onboarding",
        status: "BLOCKED",
        priority: "high",
        blockReason: "En attente de validation design",
        dueDate: daysFromNow(2),
      },
    ],
  });

  await completeOnboarding(userId);
}

export async function startDemoSession(): Promise<string> {
  const userId = await ensureDemoUser();
  await resetAndSeedDemoData(userId);
  return userId;
}

export async function isDemoUserId(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email === DEMO_USER_EMAIL;
}
