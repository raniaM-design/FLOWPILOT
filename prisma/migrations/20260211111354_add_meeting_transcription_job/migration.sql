-- CreateTable
CREATE TABLE "MeetingTranscriptionJob" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "whisperJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "transcribedText" TEXT,
    "segments" TEXT,
    "errorMessage" TEXT,
    "whisperApiUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingTranscriptionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingTranscriptionJob_meetingId_idx" ON "MeetingTranscriptionJob"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingTranscriptionJob_status_idx" ON "MeetingTranscriptionJob"("status");

-- CreateIndex
CREATE INDEX "MeetingTranscriptionJob_whisperJobId_idx" ON "MeetingTranscriptionJob"("whisperJobId");

-- AddForeignKey
ALTER TABLE "MeetingTranscriptionJob" ADD CONSTRAINT "MeetingTranscriptionJob_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

