-- AlterTable
-- Ajouter la colonne isCompanyAdmin si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'isCompanyAdmin'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isCompanyAdmin" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

