-- Souscription Web Push optionnelle pour les rappels standup
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "web_push_subscription" JSONB;
