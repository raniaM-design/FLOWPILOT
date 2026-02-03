import { getCompanyStats } from "@/lib/company/getCompanyStats";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { TeamSpaceSection } from "./team-space-section";

interface TeamSpaceSectionWrapperProps {
  companyName: string;
  members: Array<{
    id: string;
    email: string;
    isCompanyAdmin: boolean;
  }>;
  isCompanyAdmin: boolean;
}

export async function TeamSpaceSectionWrapper({
  companyName,
  members,
  isCompanyAdmin,
}: TeamSpaceSectionWrapperProps) {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return null;
  }

  const stats = await getCompanyStats(userId);

  return (
    <TeamSpaceSection
      companyName={companyName}
      members={members}
      isCompanyAdmin={isCompanyAdmin}
      stats={stats}
    />
  );
}

