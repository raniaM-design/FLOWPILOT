-- Standup quotidien : préférences utilisateur + complétions par jour calendaire

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "standupWindowStartHour" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "standupWindowEndHour" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "standupReminderHour" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "standupReminderMinute" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "standupTimezone" TEXT NOT NULL DEFAULT 'Europe/Paris';

CREATE TABLE IF NOT EXISTS "StandupCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarDay" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandupCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StandupCompletion_userId_calendarDay_key" ON "StandupCompletion"("userId", "calendarDay");
CREATE INDEX IF NOT EXISTS "StandupCompletion_userId_idx" ON "StandupCompletion"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StandupCompletion_userId_fkey'
  ) THEN
    ALTER TABLE "StandupCompletion" ADD CONSTRAINT "StandupCompletion_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
