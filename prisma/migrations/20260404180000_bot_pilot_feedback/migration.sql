-- Pilot chat feedback, session ratings, admin prompt config

CREATE TABLE "BotPilotMessageFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientMessageId" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotPilotMessageFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BotPilotMessageFeedback_userId_clientMessageId_key" ON "BotPilotMessageFeedback"("userId", "clientMessageId");
CREATE INDEX "BotPilotMessageFeedback_userId_idx" ON "BotPilotMessageFeedback"("userId");
CREATE INDEX "BotPilotMessageFeedback_createdAt_idx" ON "BotPilotMessageFeedback"("createdAt");
CREATE INDEX "BotPilotMessageFeedback_rating_idx" ON "BotPilotMessageFeedback"("rating");

ALTER TABLE "BotPilotMessageFeedback" ADD CONSTRAINT "BotPilotMessageFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BotPilotSessionRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotPilotSessionRating_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BotPilotSessionRating_userId_idx" ON "BotPilotSessionRating"("userId");
CREATE INDEX "BotPilotSessionRating_createdAt_idx" ON "BotPilotSessionRating"("createdAt");

ALTER TABLE "BotPilotSessionRating" ADD CONSTRAINT "BotPilotSessionRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BotPilotConfig" (
    "id" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotPilotConfig_pkey" PRIMARY KEY ("id")
);
