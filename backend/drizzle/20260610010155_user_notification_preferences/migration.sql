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
