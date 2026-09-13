DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_group_join_approval_mode') THEN
        CREATE TYPE "whatsapp_group_join_approval_mode" AS ENUM('approval_required', 'auto_approve');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.groups_view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'whatsapp.groups_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.groups_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'whatsapp.groups_manage';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"wamid" varchar(128) NOT NULL,
	"direction" "whatsapp_message_direction" NOT NULL,
	"type" varchar(32) NOT NULL,
	"content" jsonb NOT NULL,
	"status" varchar(20),
	"from_wa_id" varchar(32),
	"media_id" varchar(256),
	"media_mime" varchar(128),
	"pinned_at" timestamp(3) with time zone,
	"pin_expires_at" timestamp(3) with time zone,
	"sent_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_group_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid NOT NULL,
	"wa_id" varchar(32) NOT NULL,
	"joined_at" timestamp(3) with time zone,
	"added_via" varchar(32),
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid NOT NULL,
	"group_jid" varchar(256) NOT NULL,
	"subject" varchar(128) NOT NULL,
	"description" text,
	"join_approval_mode" "whatsapp_group_join_approval_mode" NOT NULL,
	"invite_link" text,
	"suspended" boolean DEFAULT false NOT NULL,
	"total_participant_count" integer DEFAULT 0 NOT NULL,
	"pending_join_request_count" integer DEFAULT 0 NOT NULL,
	"creation_timestamp" timestamp(3) with time zone,
	"synced_at" timestamp(3) with time zone,
	"deleted_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_group_messages_wamid_unique" ON "whatsapp_group_messages" ("wamid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_group_messages_group_sent_at_idx" ON "whatsapp_group_messages" ("group_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_group_participants_group_wa_id_unique" ON "whatsapp_group_participants" ("group_id","wa_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_groups_account_group_jid_unique" ON "whatsapp_groups" ("account_id","group_jid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_groups_account_created_at_idx" ON "whatsapp_groups" ("account_id","deleted_at","created_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_group_messages" ADD CONSTRAINT "whatsapp_group_messages_group_id_whatsapp_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "whatsapp_groups"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_group_messages" ADD CONSTRAINT "whatsapp_group_messages_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_group_participants" ADD CONSTRAINT "whatsapp_group_participants_group_id_whatsapp_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "whatsapp_groups"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_groups" ADD CONSTRAINT "whatsapp_groups_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;