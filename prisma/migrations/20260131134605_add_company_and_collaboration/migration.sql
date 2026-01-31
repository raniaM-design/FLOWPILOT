-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionInvitation" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionInvitation" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingInvitation" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_domain_idx" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "ActionInvitation_actionId_idx" ON "ActionInvitation"("actionId");

-- CreateIndex
CREATE INDEX "ActionInvitation_inviteeId_idx" ON "ActionInvitation"("inviteeId");

-- CreateIndex
CREATE INDEX "ActionInvitation_status_idx" ON "ActionInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ActionInvitation_actionId_inviteeId_key" ON "ActionInvitation"("actionId", "inviteeId");

-- CreateIndex
CREATE INDEX "DecisionInvitation_decisionId_idx" ON "DecisionInvitation"("decisionId");

-- CreateIndex
CREATE INDEX "DecisionInvitation_inviteeId_idx" ON "DecisionInvitation"("inviteeId");

-- CreateIndex
CREATE INDEX "DecisionInvitation_status_idx" ON "DecisionInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionInvitation_decisionId_inviteeId_key" ON "DecisionInvitation"("decisionId", "inviteeId");

-- CreateIndex
CREATE INDEX "MeetingInvitation_meetingId_idx" ON "MeetingInvitation"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingInvitation_inviteeId_idx" ON "MeetingInvitation"("inviteeId");

-- CreateIndex
CREATE INDEX "MeetingInvitation_status_idx" ON "MeetingInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingInvitation_meetingId_inviteeId_key" ON "MeetingInvitation"("meetingId", "inviteeId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInvitation" ADD CONSTRAINT "ActionInvitation_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInvitation" ADD CONSTRAINT "ActionInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInvitation" ADD CONSTRAINT "ActionInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionInvitation" ADD CONSTRAINT "DecisionInvitation_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionInvitation" ADD CONSTRAINT "DecisionInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionInvitation" ADD CONSTRAINT "DecisionInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInvitation" ADD CONSTRAINT "MeetingInvitation_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInvitation" ADD CONSTRAINT "MeetingInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInvitation" ADD CONSTRAINT "MeetingInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
