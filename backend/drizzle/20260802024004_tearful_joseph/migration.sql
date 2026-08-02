ALTER TYPE "app_permission" ADD VALUE 'settings.edit_meeting_integrations';--> statement-breakpoint
CREATE TABLE "meeting_provider_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"provider_slug" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp(3) with time zone,
	"scopes" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_meeting_configs" ADD COLUMN "provider_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "meeting_providers" ADD COLUMN "provider_kind" varchar(50) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_meeting_configs" ADD COLUMN "provider_metadata" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_provider_tokens_user_provider_idx" ON "meeting_provider_tokens" ("user_id","provider_slug");--> statement-breakpoint
CREATE INDEX "meeting_provider_tokens_user_id_idx" ON "meeting_provider_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX "meeting_provider_tokens_provider_slug_idx" ON "meeting_provider_tokens" ("provider_slug");--> statement-breakpoint
CREATE INDEX "meeting_provider_tokens_expires_at_idx" ON "meeting_provider_tokens" ("expires_at");--> statement-breakpoint
CREATE INDEX "meeting_providers_provider_kind_idx" ON "meeting_providers" ("provider_kind");--> statement-breakpoint
ALTER TABLE "meeting_provider_tokens" ADD CONSTRAINT "meeting_provider_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;