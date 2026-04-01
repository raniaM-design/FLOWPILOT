-- Variante Prisma par défaut : la table PostgreSQL est "User" (identifiant sensible à la casse).
-- Utilise ce fichier si `ALTER TABLE users` échoue (relation « users » introuvable).

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS stripe_customer_id        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_price_id           TEXT,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan                      TEXT NOT NULL DEFAULT 'free';
