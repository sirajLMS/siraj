ALTER TABLE "signed_url" ALTER COLUMN "uploaded_by_user_id" SET DATA TYPE uuid USING "uploaded_by_user_id"::uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signed_url_uploaded_by_user_id_idx" ON "signed_url" ("uploaded_by_user_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "signed_url" ADD CONSTRAINT "signed_url_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;