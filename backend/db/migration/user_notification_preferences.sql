-- Enable RLS on the table
ALTER TABLE "user_notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_notification_preferences" FORCE ROW LEVEL SECURITY;

-- Drop policy if exists for idempotency
DROP POLICY IF EXISTS notification_preferences_access_policy ON "user_notification_preferences";

-- Create policy: Users can only manage their own preferences
-- current_user_id() is defined in permissions_rls_policies.sql
CREATE POLICY notification_preferences_access_policy ON "user_notification_preferences"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Enable RLS on device token and delivery tracking tables
ALTER TABLE "user_device_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_device_tokens" FORCE ROW LEVEL SECURITY;

ALTER TABLE "notification_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_deliveries" FORCE ROW LEVEL SECURITY;

-- Drop policies if they exist for idempotency
DROP POLICY IF EXISTS user_device_tokens_access_policy ON "user_device_tokens";
DROP POLICY IF EXISTS notification_deliveries_access_policy ON "notification_deliveries";

-- Users can only manage their own device tokens
CREATE POLICY user_device_tokens_access_policy ON "user_device_tokens"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Users can only view their own notification deliveries
CREATE POLICY notification_deliveries_access_policy ON "notification_deliveries"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());
