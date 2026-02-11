-- Add soft delete field to MeetingTranscriptionJob
ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS "MeetingTranscriptionJob_deletedAt_idx" ON "MeetingTranscriptionJob"("deletedAt");

