import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { AlertCircle, Calendar, Ban, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";

/**
 * Composant Server Component pour la barre "Aujourd'hui"
 * Affiche un résumé des actions critiques du jour
 */
export async function TodaySummary() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  // Date du jour (début et fin de journée)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Actions en retard : assigneeId = userId, status != DONE, dueDate < aujourd'hui
  const overdueCount = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        lt: today,
      },
    },
  });

  // Actions dues aujourd'hui : assigneeId = userId, status != DONE, dueDate = aujourd'hui
  const todayCount = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        gte: today,
        lte: todayEnd,
      },
    },
  });

  // Actions bloquées : assigneeId = userId, status = BLOCKED
  const blockedCount = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      status: "BLOCKED",
    },
  });

  const totalCritical = overdueCount + todayCount + blockedCount;
  const isAllGood = totalCritical === 0;

  return (
    <FlowCard variant="outlined" className="shadow-sm">
      <FlowCardContent className="py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm font-medium text-foreground">
              {isAllGood ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Rien de critique. Continue comme ça.
                </span>
              ) : (
                "Voici ce qui compte aujourd'hui."
              )}
            </p>
            {!isAllGood && (
              <>
                {overdueCount > 0 && (
                  <Chip variant="danger" size="sm" className="gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    {overdueCount} en retard
                  </Chip>
                )}
                {todayCount > 0 && (
                  <Chip variant="warning" size="sm" className="gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {todayCount} aujourd'hui
                  </Chip>
                )}
                {blockedCount > 0 && (
                  <Chip variant="warning" size="sm" className="gap-1.5">
                    <Ban className="h-3 w-3" />
                    {blockedCount} bloquée{blockedCount > 1 ? "s" : ""}
                  </Chip>
                )}
              </>
            )}
          </div>
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}

