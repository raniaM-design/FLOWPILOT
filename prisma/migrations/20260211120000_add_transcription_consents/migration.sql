-- Add consent fields to MeetingTranscriptionJob
ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "consentRecording" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "consentProcessing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "consentDate" TIMESTAMP(3);
ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "audioDeletedAt" TIMESTAMP(3);

