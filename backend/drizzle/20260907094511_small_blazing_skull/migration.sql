DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_type') THEN
        CREATE TYPE "expense_type" AS ENUM('Salaries', 'Marketing', 'Logistics', 'Technology');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_account_purpose') THEN
        CREATE TYPE "whatsapp_account_purpose" AS ENUM('GENERAL', 'ADVERTISING', 'STUDENTS');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_message_direction') THEN
        CREATE TYPE "whatsapp_message_direction" AS ENUM('INBOUND', 'ECHO', 'API_OUTBOUND');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_onboarding_mode') THEN
        CREATE TYPE "whatsapp_onboarding_mode" AS ENUM('CLOUD_API', 'COEXISTENCE');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_sync_request_status') THEN
        CREATE TYPE "whatsapp_sync_request_status" AS ENUM('PENDING', 'REQUESTED', 'STREAMING', 'COMPLETE', 'FAILED');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_sync_status') THEN
        CREATE TYPE "whatsapp_sync_status" AS ENUM('NOT_STARTED', 'REQUESTED', 'SYNCING', 'COMPLETE', 'FAILED');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_sync_type') THEN
        CREATE TYPE "whatsapp_sync_type" AS ENUM('SMB_APP_STATE_SYNC', 'HISTORY');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_webhook_event_status') THEN
        CREATE TYPE "whatsapp_webhook_event_status" AS ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.expenses_view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.expenses_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.expenses_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.expenses_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.inbox_view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'whatsapp.inbox_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.inbox_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'whatsapp.inbox_manage';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid,
	"teacher_name" varchar(200),
	"title" varchar(200) NOT NULL,
	"type" "expense_type" NOT NULL,
	"expense_value" text NOT NULL,
	"expense_currency" "currency_code" NOT NULL,
	"payment_date" text NOT NULL,
	"expense_date" varchar(7) NOT NULL,
	"note" text,
	"source_entity" varchar(64),
	"source_entity_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	"deleted_by_user_id" uuid,
	"deleted_reason" varchar(500),
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_expense_date_format_chk" CHECK ("expense_date" ~ '^\d{4}-\d{2}$')
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"app_id" varchar(64),
	"app_secret" text,
	"verify_token" varchar(255),
	"phone_number_id" varchar(64),
	"waba_id" varchar(64),
	"access_token" text,
	"es_config_id" varchar(64),
	"updated_by_user_id" uuid,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid NOT NULL,
	"phone_number" varchar(32),
	"user_id" varchar(64),
	"username" varchar(128),
	"full_name" varchar(255),
	"first_name" varchar(128),
	"removed_at" timestamp(3) with time zone,
	"last_action_at" timestamp(3) with time zone NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid NOT NULL,
	"wa_id" varchar(32),
	"user_id" varchar(64),
	"username" varchar(128),
	"display_name" varchar(255),
	"last_message_at" timestamp(3) with time zone,
	"last_message_preview" varchar(140),
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp(3) with time zone
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"wamid" varchar(128) NOT NULL,
	"direction" "whatsapp_message_direction" NOT NULL,
	"type" varchar(32) NOT NULL,
	"content" jsonb NOT NULL,
	"status" varchar(20),
	"media_placeholder" boolean DEFAULT false NOT NULL,
	"media_id" varchar(128),
	"media_mime" varchar(64),
	"media_sha256" varchar(64),
	"phase" integer,
	"chunk_order" integer,
	"sent_at" timestamp(3) with time zone,
	"edited_at" timestamp(3) with time zone,
	"revoked_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_sync_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid NOT NULL,
	"sync_type" "whatsapp_sync_type" NOT NULL,
	"request_id" varchar(128),
	"status" "whatsapp_sync_request_status" DEFAULT 'PENDING'::"whatsapp_sync_request_status" NOT NULL,
	"requested_at" timestamp(3) with time zone,
	"completed_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid,
	"field" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"status" "whatsapp_webhook_event_status" DEFAULT 'PENDING'::"whatsapp_webhook_event_status" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"received_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp(3) with time zone
);--> statement-breakpoint
ALTER TABLE "carryover_balance_items" ADD COLUMN IF NOT EXISTS "original_partial_percentage" integer;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "purpose" "whatsapp_account_purpose" DEFAULT 'GENERAL'::"whatsapp_account_purpose" NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "onboarding_mode" "whatsapp_onboarding_mode" DEFAULT 'CLOUD_API'::"whatsapp_onboarding_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "sync_status" "whatsapp_sync_status" DEFAULT 'NOT_STARTED'::"whatsapp_sync_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "sync_phase" integer;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "sync_progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "sync_deadline_at" timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "sync_failure_reason" varchar(64);--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "offboarded_at" timestamp(3) with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_teacher_id_idx" ON "expenses" ("teacher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_type_idx" ON "expenses" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_payment_date_idx" ON "expenses" ("payment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_expense_date_idx" ON "expenses" ("expense_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_source_entity_idx" ON "expenses" ("source_entity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_source_entity_id_idx" ON "expenses" ("source_entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_created_by_user_id_idx" ON "expenses" ("created_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_deleted_at_idx" ON "expenses" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_type_expense_date_idx" ON "expenses" ("type","expense_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_configs_updated_by_user_id_idx" ON "whatsapp_configs" ("updated_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_contacts_account_phone_unique" ON "whatsapp_contacts" ("account_id","phone_number") WHERE "phone_number" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_contacts_account_user_id_unique" ON "whatsapp_contacts" ("account_id","user_id") WHERE "user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_conversations_account_wa_id_unique" ON "whatsapp_conversations" ("account_id","wa_id") WHERE "wa_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_conversations_account_user_id_unique" ON "whatsapp_conversations" ("account_id","user_id") WHERE "user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_conversations_account_last_message_at_idx" ON "whatsapp_conversations" ("account_id","last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_messages_wamid_unique" ON "whatsapp_messages" ("wamid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_messages_conversation_sent_at_idx" ON "whatsapp_messages" ("conversation_id","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_messages_account_sent_at_idx" ON "whatsapp_messages" ("account_id","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_messages_account_phase_chunk_idx" ON "whatsapp_messages" ("account_id","phase","chunk_order");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_sync_requests_account_type_unique" ON "whatsapp_sync_requests" ("account_id","sync_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_webhook_events_status_received_at_idx" ON "whatsapp_webhook_events" ("status","received_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_user_id_users_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_configs" ADD CONSTRAINT "whatsapp_configs_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_3jpsZTHEO1Jd_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_sync_requests" ADD CONSTRAINT "whatsapp_sync_requests_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_webhook_events" ADD CONSTRAINT "whatsapp_webhook_events_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_sync_progress_range_chk" CHECK ("sync_progress" BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;