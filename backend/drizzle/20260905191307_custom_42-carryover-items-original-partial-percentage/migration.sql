-- Source: 42-carryover-items-original-partial-percentage.sql
-- Snapshot column for the session's pre-link partial-pay percentage. The
-- class_instances CHECK ties is_partial_percentage to the PARTIALLY status,
-- so the carryover link transition clears the live column; delete/revert
-- restores it from this snapshot.
ALTER TABLE "carryover_balance_items" ADD COLUMN IF NOT EXISTS "original_partial_percentage" integer;--> statement-breakpoint

