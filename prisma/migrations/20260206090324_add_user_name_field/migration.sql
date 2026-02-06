-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "CompanyInvitation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionMention" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionMention" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMention" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvitation_tokenHash_key" ON "CompanyInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "CompanyInvitation_companyId_idx" ON "CompanyInvitation"("companyId");

-- CreateIndex
CREATE INDEX "CompanyInvitation_email_idx" ON "CompanyInvitation"("email");

-- CreateIndex
CREATE INDEX "CompanyInvitation_tokenHash_idx" ON "CompanyInvitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvitation_companyId_email_key" ON "CompanyInvitation"("companyId", "email");

-- CreateIndex
CREATE INDEX "ActionMention_actionId_idx" ON "ActionMention"("actionId");

-- CreateIndex
CREATE INDEX "ActionMention_userId_idx" ON "ActionMention"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionMention_actionId_userId_key" ON "ActionMention"("actionId", "userId");

-- CreateIndex
CREATE INDEX "DecisionMention_decisionId_idx" ON "DecisionMention"("decisionId");

-- CreateIndex
CREATE INDEX "DecisionMention_userId_idx" ON "DecisionMention"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionMention_decisionId_userId_key" ON "DecisionMention"("decisionId", "userId");

-- CreateIndex
CREATE INDEX "MeetingMention_meetingId_idx" ON "MeetingMention"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingMention_userId_idx" ON "MeetingMention"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingMention_meetingId_userId_key" ON "MeetingMention"("meetingId", "userId");

-- AddForeignKey
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionMention" ADD CONSTRAINT "ActionMention_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionMention" ADD CONSTRAINT "ActionMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionMention" ADD CONSTRAINT "DecisionMention_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionMention" ADD CONSTRAINT "DecisionMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMention" ADD CONSTRAINT "MeetingMention_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMention" ADD CONSTRAINT "MeetingMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
