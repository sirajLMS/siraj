ALTER TABLE "parents" ALTER COLUMN "whatsapp" SET DATA TYPE text USING "whatsapp"::text;--> statement-breakpoint
ALTER TABLE "teachers" ALTER COLUMN "phone" SET DATA TYPE text USING "phone"::text;