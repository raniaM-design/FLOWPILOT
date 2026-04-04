-- Notification preferences on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_daily_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_daily_hour" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_daily_email" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_daily_push" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_weekly_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_weekly_hour" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_weekly_email" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_digest_weekly_push" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_immediate_assign_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_immediate_blocked_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_standup_reminder_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_standup_email_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_standup_push_enabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "NotificationSendLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationSendLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSendLog_userId_kind_periodKey_key" ON "NotificationSendLog"("userId", "kind", "periodKey");
CREATE INDEX IF NOT EXISTS "NotificationSendLog_userId_idx" ON "NotificationSendLog"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'NotificationSendLog_userId_fkey'
  ) THEN
    ALTER TABLE "NotificationSendLog" ADD CONSTRAINT "NotificationSendLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
