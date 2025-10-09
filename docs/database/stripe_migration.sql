-- Migration to add Stripe subscription columns to users table
-- Run this in Supabase SQL Editor

-- Add subscription columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);

-- Update existing users to have default subscription status
UPDATE users 
SET subscription_status = 'free' 
WHERE subscription_status IS NULL AND subscription_tier = 'free';

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'subscription_tier')
ORDER BY column_name;

