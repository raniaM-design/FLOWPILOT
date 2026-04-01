ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id        VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id    VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_price_id           VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan                      VARCHAR(50) DEFAULT 'free';
