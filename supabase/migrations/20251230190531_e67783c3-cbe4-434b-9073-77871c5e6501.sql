-- Add device type and FCM/APNS token columns to push_subscriptions
ALTER TABLE push_subscriptions 
ADD COLUMN device_type TEXT DEFAULT 'web' CHECK (device_type IN ('web', 'android', 'ios'));

ALTER TABLE push_subscriptions 
ADD COLUMN fcm_token TEXT;

ALTER TABLE push_subscriptions 
ADD COLUMN apns_token TEXT;

-- Make Web Push specific columns nullable for native devices
ALTER TABLE push_subscriptions 
ALTER COLUMN p256dh DROP NOT NULL,
ALTER COLUMN auth DROP NOT NULL,
ALTER COLUMN endpoint DROP NOT NULL;

-- Add unique index for FCM tokens to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_fcm_token_idx 
ON push_subscriptions(user_id, fcm_token) WHERE fcm_token IS NOT NULL;