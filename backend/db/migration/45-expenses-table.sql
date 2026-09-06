-- Expense ledger table — canonical store for all outgoing money (manual
-- operational expenses + auto-generated salary payouts from carryover
-- settlements). Adds the `expense_type` enum, the `expenses` table with a
-- YYYY-MM format CHECK on `expense_date`, three foreign keys, and nine
-- indexes (including the type + expense-date composite for the list filter).
-- Additive-only; all statements are idempotent (IF NOT EXISTS / DO-guard)
-- so the file is safe to re-run and safe to share the migrations ledger
-- with concurrent schema work.

DO $$ BEGIN
  CREATE TYPE expense_type AS ENUM ('Salaries', 'Marketing', 'Logistics', 'Technology');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expense_date_format_chk" CHECK ("expense_date" ~ '^\d{4}-\d{2}$');
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_user_id_users_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "expenses_teacher_id_idx" ON "expenses" ("teacher_id");
CREATE INDEX IF NOT EXISTS "expenses_type_idx" ON "expenses" ("type");
CREATE INDEX IF NOT EXISTS "expenses_payment_date_idx" ON "expenses" ("payment_date");
CREATE INDEX IF NOT EXISTS "expenses_expense_date_idx" ON "expenses" ("expense_date");
CREATE INDEX IF NOT EXISTS "expenses_source_entity_idx" ON "expenses" ("source_entity");
CREATE INDEX IF NOT EXISTS "expenses_source_entity_id_idx" ON "expenses" ("source_entity_id");
CREATE INDEX IF NOT EXISTS "expenses_created_by_user_id_idx" ON "expenses" ("created_by_user_id");
CREATE INDEX IF NOT EXISTS "expenses_deleted_at_idx" ON "expenses" ("deleted_at");
CREATE INDEX IF NOT EXISTS "expenses_type_expense_date_idx" ON "expenses" ("type","expense_date");
