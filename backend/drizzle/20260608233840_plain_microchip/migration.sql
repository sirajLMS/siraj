CREATE TYPE "app_language" AS ENUM('ar', 'en');--> statement-breakpoint
CREATE TYPE "country_code" AS ENUM('SA', 'PS', 'YE', 'SY', 'EG', 'KW', 'QA', 'OM', 'BH', 'LB', 'JO', 'IQ', 'LY', 'AE', 'TN', 'DZ', 'MA', 'SD', 'ID', 'MR', 'SO', 'KM', 'DJ', 'ER', 'SS', 'EH', 'AD', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DK', 'DM', 'DO', 'EC', 'EE', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'IE', 'IM', 'IN', 'IO', 'IR', 'IS', 'IT', 'JE', 'JM', 'JP', 'KE', 'KG', 'KH', 'KI', 'KN', 'KP', 'KR', 'KY', 'KZ', 'LA', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PT', 'PW', 'PY', 'RE', 'RO', 'RS', 'RU', 'RW', 'SB', 'SC', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SR', 'ST', 'SV', 'SX', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TO', 'TR', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'XK', 'YT', 'ZA', 'ZM', 'ZW');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE "cache" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_usage" (
	"id" bigserial PRIMARY KEY,
	"file_path" varchar(1024) NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"reference_id" bigint NOT NULL,
	"reference_table" varchar(100) NOT NULL,
	"created_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signed_url" (
	"id" varchar(64) PRIMARY KEY,
	"file_path" varchar(1024) NOT NULL,
	"content_type" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"content_hash" varchar(128) NOT NULL,
	"expires_at" timestamp(3) NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_directory" (
	"id" bigserial PRIMARY KEY,
	"path" varchar(1024) NOT NULL UNIQUE,
	"allow_uploads" boolean DEFAULT true NOT NULL,
	"allow_delete" boolean DEFAULT true NOT NULL,
	"allow_move" boolean DEFAULT true NOT NULL,
	"allow_create_sub_dirs" boolean DEFAULT true NOT NULL,
	"allow_delete_files" boolean DEFAULT true NOT NULL,
	"allow_move_files" boolean DEFAULT true NOT NULL,
	"is_protected" boolean DEFAULT false NOT NULL,
	"protect_children" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_file" (
	"id" bigserial PRIMARY KEY,
	"path" text NOT NULL UNIQUE,
	"is_protected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone_number" varchar(255),
	"date_of_birth" timestamp(3),
	"gender" "gender",
	"nationality" "country_code",
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passwordResetTokens" (
	"email" varchar(255) PRIMARY KEY,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" integer PRIMARY KEY,
	"name" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY,
	"userId" integer,
	"ipAddress" varchar(45),
	"userAgent" text,
	"payload" text NOT NULL,
	"lastActivity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer,
	"role_id" integer,
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"email_verified_at" timestamp(3),
	"password" varchar(255) NOT NULL,
	"remember_token" varchar(100),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cache_expires_at_idx" ON "cache" ("expires_at");--> statement-breakpoint
CREATE INDEX "signed_url_expires_at_idx" ON "signed_url" ("expires_at");--> statement-breakpoint
CREATE INDEX "signed_url_used_expires_idx" ON "signed_url" ("used","expires_at");--> statement-breakpoint
CREATE INDEX "idx_students_name_fts" ON "student" USING gin (to_tsvector('simple', "name"));--> statement-breakpoint
CREATE INDEX "idx_students_name_trgm" ON "student" USING gist ("name" gist_trgm_ops);--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" ("userId");--> statement-breakpoint
CREATE INDEX "sessions_last_activity_index" ON "sessions" ("lastActivity");--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;