-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "ActionItem" ADD COLUMN "blockReason" TEXT;
