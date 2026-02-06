-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingStep_userId_idx" ON "OnboardingStep"("userId");

-- CreateIndex
CREATE INDEX "OnboardingStep_stepKey_idx" ON "OnboardingStep"("stepKey");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingStep_userId_stepKey_key" ON "OnboardingStep"("userId", "stepKey");

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
