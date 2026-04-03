import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { loadStandupPageData } from "@/lib/standup/load-standup-data";
import { StandupClient } from "./standup-client";

export const metadata = {
  title: "Standup",
  robots: { index: false, follow: false },
};

export default async function StandupPage() {
  const userId = await getCurrentUserIdOrThrow();
  const data = await loadStandupPageData(userId);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { standupTimezone: true },
  });

  const tz = user.standupTimezone || "Europe/Paris";
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(new Date());

  return (
    <StandupClient
      firstName={data.firstName}
      dateLabel={dateLabel}
      priorities={data.priorities}
      attention={data.attention}
    />
  );
}
