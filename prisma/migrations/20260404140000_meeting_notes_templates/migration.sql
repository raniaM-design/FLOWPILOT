-- Modèles de compte rendu (utilisateur + liaison réunion)

CREATE TABLE IF NOT EXISTS "MeetingNotesTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingNotesTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MeetingNotesTemplate_userId_idx" ON "MeetingNotesTemplate"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MeetingNotesTemplate_userId_fkey'
  ) THEN
    ALTER TABLE "MeetingNotesTemplate" ADD CONSTRAINT "MeetingNotesTemplate_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "notes_template_preset" TEXT;
ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "notes_custom_template_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Meeting_notes_custom_template_id_fkey'
  ) THEN
    ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_notes_custom_template_id_fkey"
      FOREIGN KEY ("notes_custom_template_id") REFERENCES "MeetingNotesTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
