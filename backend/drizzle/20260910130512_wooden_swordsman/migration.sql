CREATE TABLE IF NOT EXISTS "whatsapp_test_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid NOT NULL,
	"phone_number" varchar(32) NOT NULL,
	"status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"last_checked_at" timestamp(3) with time zone,
	"last_error_code" varchar(24),
	"note" varchar(200),
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "is_test_number" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "last_inbound_message_at" timestamp(3) with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_test_recipients_account_phone_unique" ON "whatsapp_test_recipients" ("account_id","phone_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_test_recipients_account_id_idx" ON "whatsapp_test_recipients" ("account_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_test_recipients" ADD CONSTRAINT "whatsapp_test_recipients_account_id_whatsapp_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "whatsapp_test_recipients" ADD CONSTRAINT "whatsapp_test_recipients_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;