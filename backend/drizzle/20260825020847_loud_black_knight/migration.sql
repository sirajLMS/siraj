DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_type') THEN
        CREATE TYPE "leave_request_type" AS ENUM('DELAY', 'CANCEL');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'session.self_delay'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'session.self_delay';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'session.self_cancel'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'session.self_cancel';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'payments.ledger_view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'payments.ledger_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_status') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'leave_request_status' AND e.enumlabel = 'REJECTED'
    ) THEN
        ALTER TYPE "leave_request_status" ADD VALUE 'REJECTED';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_requester_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'leave_requester_type' AND e.enumlabel = 'STUDENT'
    ) THEN
        ALTER TYPE "leave_requester_type" ADD VALUE 'STUDENT';
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "request_type" "leave_request_type";--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "proposed_start_at" timestamp(3) with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leave_requests_pending_class_instance_unique_idx" ON "leave_requests" ("class_instance_id") WHERE status = 'PENDING';