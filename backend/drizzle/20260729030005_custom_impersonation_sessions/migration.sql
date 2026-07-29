-- Source: impersonation_sessions.sql
-- Impersonation session tracking for super-admin "view as user" feature
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  session_id VARCHAR(255) NOT NULL,
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS impersonation_sessions_actor_idx ON impersonation_sessions(actor_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS impersonation_sessions_target_idx ON impersonation_sessions(target_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS impersonation_sessions_session_idx ON impersonation_sessions(session_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS impersonation_sessions_active_actor_idx ON impersonation_sessions(actor_user_id, is_active);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS impersonation_sessions_one_active_per_actor
  ON impersonation_sessions(actor_user_id)
  WHERE is_active = true;--> statement-breakpoint

