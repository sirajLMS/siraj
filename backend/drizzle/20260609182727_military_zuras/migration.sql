CREATE TABLE "currency_exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"from_currency" varchar(10) NOT NULL,
	"to_currency" varchar(10) NOT NULL,
	"rate" numeric(12,6) NOT NULL,
	"effective_date" timestamp(3) with time zone NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "currency_exchange_rates_from_to_idx" ON "currency_exchange_rates" ("from_currency","to_currency");--> statement-breakpoint
CREATE UNIQUE INDEX "currency_exchange_rates_effective_unique_idx" ON "currency_exchange_rates" ("from_currency","to_currency","effective_date");