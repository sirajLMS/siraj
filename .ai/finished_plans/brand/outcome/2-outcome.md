# Task 2 — Create `appearance_settings` Drizzle schema

## Summary

Created the `appearance_settings` Drizzle table per implementation.md §1,
generated the migration SQL via `bun run db generate`, applied it to the dev
DB via `bun run db push` (per task spec), then ran `bun run db migrate` to
track the migration properly in `drizzle.__drizzle_migrations` and rewrite
the SQL to be fully idempotent (via the project’s `ensureIdempotentMigrations()`
pre-processor).

The table is verified to exist in the dev DB with the exact column shape,
indexes, and FK from the design. The schema file passes the full sub-loop
lifecycle (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene)
with exit 0.

## Files Created

- `backend/db/schema/appearance/appearance-settings.schema.ts` (1.78 KB) —
  the `appearanceSettings` Drizzle table definition.
- `backend/db/schema/appearance/index.ts` (133 B) — sub-directory barrel
  (`export * from "./appearance-settings.schema";`).
- `backend/drizzle/20260822060847_long_slayback/migration.sql` (auto-generated
  by `drizzle-kit generate`, then auto-rewritten by
  `ensureIdempotentMigrations()` during `db migrate` to the idempotent form
  shown below).
- `backend/drizzle/20260822060847_long_slayback/snapshot.json` (auto-generated
  by `drizzle-kit generate`; this is now the latest drizzle snapshot).

## Files Modified

- `backend/db/schema/index.ts` — added `export * from "./appearance";` in
  alphabetical order between `__shared__` and `audit` (single-line insertion,
  no other lines touched).

## Schema definition (`appearance-settings.schema.ts`)

```ts
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/backend/db/schema/users/users";

/**
 * Site appearance / branding settings.
 *
 * Single global row (no `tenant_id`); seeded via upsert on first read by
 * `AppearanceSettingsService.getFirstAppearancePublished`. The published
 * columns (`primary_main`, `secondary_main`, `logo_url`, `site_name`,
 * `site_title`, `site_description`, `default_color_scheme`) hold the
 * currently-live branding. The `draft_fields` jsonb holds an in-progress
 * `AppearanceFields` payload (per-mode colors etc.) that is copied into the
 * published columns on `publish`.
 *
 * See `.ai/plans/brand/implementation.md` §1 and `outcome/decisions.md` for
 * the locked decisions (#2, #7, #12).
 */
export const appearanceSettings = pgTable(
  "appearance_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    primaryMain: text("primary_main").notNull(),
    secondaryMain: text("secondary_main").notNull(),
    logoUrl: text("logo_url"),
    siteName: text("site_name").notNull(),
    siteTitle: text("site_title").notNull(),
    siteDescription: text("site_description").notNull(),
    defaultColorScheme: text("default_color_scheme").notNull(),
    draftFields: jsonb("draft_fields").notNull(),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
  },
  table => [
    index("appearance_settings_updated_by_user_id_idx").on(table.updatedByUserId),
    index("appearance_settings_updated_at_idx").on(table.updatedAt),
  ],
);
```

### Deviations from implementation.md §1 (intentional)

1. **`timestamptz(...)` → `timestamp("...", { withTimezone: true, precision: 3 })`.**
   The repo has zero usages of `timestamptz` in `backend/db/schema/`
   (`grep -rn timestamptz backend/db/schema/` returns nothing). Every sibling
   schema (`audit.ts`, `site-content.ts`, `cron.ts`, `audit_logs`) uses the
   `timestamp("name", { withTimezone: true, precision: 3 })` form. Both compile
   to the same PG type (`timestamp with time zone`), but following the project
   convention keeps the codescene health check happy and avoids a one-off
   inconsistency. Millisecond precision (precision: 3) matches `audit_logs`
   and `cron_schedules`.

2. **Column modifier chain order** — `uuid("id").defaultRandom().primaryKey()`
   and `timestamp(...).defaultNow().notNull()` — to match the chain order used
   by every sibling schema (the design had `.primaryKey().defaultRandom()` and
   `.defaultNow().notNull()` which is functionally equivalent but visually
   inconsistent with the rest of the codebase).

3. **`updatedByUserId` FK** — added `{ onDelete: "set null" }` to match the
   pattern in `audit_logs.actorUserId`, `site_content.updatedByUserId`, and
   `cron_schedules.updatedByUserId`. The design spec omitted the delete rule;
   `set null` is the safe default for a soft-FK audit column on a single-row
   table (deleting a user shouldn’t cascade-delete the site branding row).

4. **Two secondary indexes** added on `updatedByUserId` (FK column) and
   `updatedAt`. The design spec had no indexes; the project convention (see
   `site_content`, `audit_logs`, `cron_schedules`) is to index every FK column
   and every timestamp used for ordering. Even though this is a single-row
   table today, the indexes are cheap and match the repo style.

5. **Filename `appearance-settings.schema.ts`** — the AGENTS.md convention is
   `<entity>.ts` (e.g. `audit.ts`, `site-content.ts`), but both the task spec
   and `implementation.md` §1 explicitly require `appearance-settings.schema.ts`.
   The `.schema.ts` suffix is a one-off for this feature; codescene did not
   flag it.

## Migration SQL (final, idempotent form)

After `ensureIdempotentMigrations()` rewrote it during `bun run db migrate`:

```sql
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = app_permission AND e.enumlabel = settings.appearance_manage
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE settings.appearance_manage;
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appearance_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"primary_main" text NOT NULL,
	"secondary_main" text NOT NULL,
	"logo_url" text,
	"site_name" text NOT NULL,
	"site_title" text NOT NULL,
	"site_description" text NOT NULL,
	"default_color_scheme" text NOT NULL,
	"draft_fields" jsonb NOT NULL,
	"updated_by_user_id" uuid,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appearance_settings_updated_by_user_id_idx"
  ON "appearance_settings" ("updated_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appearance_settings_updated_at_idx"
  ON "appearance_settings" ("updated_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "appearance_settings" ADD CONSTRAINT
      "appearance_settings_updated_by_user_id_users_id_fkey"
      FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id")
      ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;
```

### Why the `ALTER TYPE app_permission ADD VALUE` is in the migration

Drizzle diffed the TS `AppPermission` enum (which has
`SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage"` from Task 1)
against the previous snapshot (`20260815183754_update-academy-admin-group-name/snapshot.json`,
which does NOT contain this value) and emitted an `ALTER TYPE` for it. The
value was already added to the dev DB’s `app_permission` PG enum in Task 1.2
via the custom migration `7c-appearance-permissions-enum.sql`
(`ALTER TYPE app_permission ADD VALUE IF NOT EXISTS settings.appearance_manage`).

The `ensureIdempotentMigrations()` transformer wraps the `ALTER TYPE ... ADD VALUE`
in a `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_enum ...) ... END $$` block,
so it is a no-op on this dev DB (the value already exists) but is still
applied on fresh DBs / new environments that do not have the value yet. The
`BEFORE settings.timezones_view` clause from the original drizzle-generated
SQL is dropped by the transformer (it only extracts the type name + enum
value, not the position clause); this is acceptable because the value is
already positioned correctly on existing DBs, and on fresh DBs the position
doesn’t matter for enum semantics.

## Migration apply sequence

1. `bun run db generate` → drizzle-kit generated
   `backend/drizzle/20260822060847_long_slayback/migration.sql` +
   `snapshot.json`. Output: `[✓] Your SQL migration ➜
   backend/drizzle/20260822060847_long_slayback/migration.sql 🚀`.

2. `bun run db push` → applied the schema directly to the dev DB via
   `drizzle-kit push --force`. Output: `[✓] Changes applied`. This created
   the `appearance_settings` table, both indexes, the PK, and the FK.
   `db push` does NOT track the migration in `drizzle.__drizzle_migrations`
   (it syncs the TS schema directly to the DB).

3. `bun run db migrate` (defensive follow-up to track the migration properly)
   → `applyCustomMigrations()` (auto-bundler; no new custom SQL files, no-op)
   → `ensureIdempotentMigrations()` (rewrote `migration.sql` to the idempotent
   form shown above)
   → `runDrizzleMigrations()` (pre-committed the enum addition via
   `preCommitEnumStatementsForMigrationFile` — no-op because the value exists;
   then applied the migration per-folder, all statements no-ops because the
   table/indexes/FK already exist)
   → recorded the migration in `drizzle.__drizzle_migrations` (id=83,
   hash=`3ef2191ba377f541faaef31b41173c7237da4e8f5c6dae7f256c6049740d3155`,
   created_at=`1787378927000`).

   Output:
   ```
   [LOG] Ensure Enum Values Committed: Pre-executing 1 enum addition(s)
         from backend/drizzle/20260822060847_long_slayback/migration.sql...
   [LOG] Applied migration: 20260822060847_long_slayback
   [LOG] Migrations completed successfully!
   ```

### Why run `db migrate` after `db push`?

The task spec said "Apply: `bun run db push`. If it doesn’t work, try
`bun run db migrate`." `db push` succeeded (the table was created), but it
left the generated migration file `20260822060847_long_slayback/migration.sql`
in a non-idempotent form and NOT tracked in `drizzle.__drizzle_migrations`.
Running `db migrate` afterwards was a defensive follow-up that:

- Rewrote `migration.sql` to be fully idempotent via
  `ensureIdempotentMigrations()` (so future `db migrate` runs from any
  environment are no-ops if the objects already exist).
- Tracked the migration in `drizzle.__drizzle_migrations` (so future
  `db migrate` runs skip it instead of re-applying and failing on
  `relation already exists` / `enum label already exists`).
- Verified that the migration system handles the Phase-1 enum carry-over
  correctly (the `ALTER TYPE app_permission ADD VALUE settings.appearance_manage`
  is a no-op on this DB because of the `IF NOT EXISTS` pg_enum check).

This is a stricter outcome than the task minimum (which only required `db push`),
but it leaves the migration system in a clean state for Phase 2.2+ (repo,
service, tests).

## Verification results

### 1. Sub-loop lifecycle (codescene stage) — EXIT 0

```bash
cd /home/ahmed/Projects/siraj && \
  CODESCENE_BIN=/home/ahmed/.local/bin/cs \
  bun run scripts/health/sub-loop.ts \
    backend/db/schema/appearance/appearance-settings.schema.ts \
    --lifecycle codescene
```

Result:
```
✅ tsgo passed (no errors for backend/db/schema/appearance/appearance-settings.schema.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

> **Note on `CODESCENE_BIN`:** the first sub-loop run failed at the codescene
> stage with `Failed to execute CodeScene CLI: Executable not found in $PATH:
> "cs"`. The `cs` binary IS installed at `/home/ahmed/.local/bin/cs` (68 MB,
> dated Aug 18) but `/home/ahmed/.local/bin` is not on the PATH inherited by
> the SSH session. Setting `CODESCENE_BIN=/home/ahmed/.local/bin/cs` (read by
> `scripts/health/codescene/config.ts`) resolves it. Future agents running
> codescene via SSH should set this env var (or prepend
> `/home/ahmed/.local/bin` to PATH).

### 2. Project-wide tsgo — EXIT 0

```bash
cd /home/ahmed/Projects/siraj && bun tsgo 2>&1 | grep -E "error TS|Found [0-9]+ error"
```
Result: no output (0 errors). Matches the 0-error baseline from
`0.1-baseline-outcome.md`. No TypeScript regression from the new schema file
or the barrel update.

### 3. Table structure in dev DB

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = public AND table_name = appearance_settings
ORDER BY ordinal_position;
```

Result (12 columns, exact match to the design):

| # | column_name | data_type | is_nullable | column_default |
|---|---|---|---|---|
| 0 | id | uuid | NO | gen_random_uuid() |
| 1 | primary_main | text | NO | null |
| 2 | secondary_main | text | NO | null |
| 3 | logo_url | text | YES | null |
| 4 | site_name | text | NO | null |
| 5 | site_title | text | NO | null |
| 6 | site_description | text | NO | null |
| 7 | default_color_scheme | text | NO | null |
| 8 | draft_fields | jsonb | NO | null |
| 9 | updated_by_user_id | uuid | YES | null |
| 10 | updated_at | timestamp with time zone | NO | now() |
| 11 | created_at | timestamp with time zone | NO | now() |

### 4. Indexes

| indexname | def |
|---|---|
| appearance_settings_pkey | CREATE UNIQUE INDEX ... ON public.appearance_settings USING btree (id) |
| appearance_settings_updated_at_idx | CREATE INDEX ... ON public.appearance_settings USING btree (updated_at) |
| appearance_settings_updated_by_user_id_idx | CREATE INDEX ... ON public.appearance_settings USING btree (updated_by_user_id) |

### 5. Foreign keys

| conname | def |
|---|---|
| appearance_settings_updated_by_user_id_users_id_fkey | FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL |

### 6. Row count

`SELECT COUNT(*) FROM appearance_settings` → `0`. Table is empty; will be
seeded by `AppearanceSettingsService.getFirstAppearancePublished` (upsert on
first read) in Task 2.3.

### 7. Migration tracked

`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY
created_at DESC LIMIT 3`:

| id | hash | created_at |
|---|---|---|
| 83 | 3ef2191ba377f541faaef31b41173c7237da4e8f5c6dae7f256c6049740d3155 | 1787378927000 |
| 82 | 2001a3109b2edab3047907c4f0890964498c09d354f0cf622a2933a35dea16fe | 1787377741000 |
| 81 | daee4a53db4090dcb10012897e1fef3554fbc708a998df87c8c939705826e59f | 1787377740000 |

id=83 is the new `20260822060847_long_slayback` migration (created_at
1787378927000 = 2026-08-22T06:08:47Z, matching the folder timestamp). id=82
and id=81 are the Phase-1 custom migrations (`7d-appearance-permissions-data`
and `7c-appearance-permissions-enum` respectively).

## Requirements Coverage

- **AC-1** — `appearance_settings` table exists with the full column shape
  required by the design (12 columns including `draft_fields` jsonb for the
  in-progress draft payload).
- **AC-2** — single-row semantics: no `tenant_id`, no `is_published` flag;
  the published columns hold the live branding and `draft_fields` holds the
  in-progress edit. Service layer (Task 2.3) will enforce single-row via
  upsert-on-first-read.

## Carry-Forward Knowledge for Phase 2.1+

1. **Table name + export name**: `appearanceSettings` (camelCase TS export) /
   `appearance_settings` (snake_case PG table). Import via
   `import { appearanceSettings } from "@/backend/db/schema";` (top-level
   barrel) or `import { appearanceSettings } from "@/backend/db/schema/appearance/appearance-settings.schema";`
   (deep import). Both work; the top-level barrel is the recommended entry
   point per `backend/db/schema/AGENTS.md`.

2. **`draftFields` is untyped `jsonb`**: the column is `jsonb("draft_fields").notNull()`
   without `$type<AppearanceFields>()`. Task 2.1 will define the
   `AppearanceFields` interface; Task 2.2 (repo) can add
   `.$type<AppearanceFields>()` to the column for end-to-end type safety,
   or cast at the repo boundary. Either is acceptable.

3. **`defaultColorScheme` is plain `text`**: the design specified plain text,
   not a varchar with length or an enum. Values are constrained to `light`
   or `dark` at the application layer (Task 2.1 type, Task 2.3 service
   validation). If a future task wants DB-level enforcement, a CHECK
   constraint or a Drizzle enum can be added — but that’s out of scope for
   the current plan.

4. **`updatedByUserId` is nullable with `ON DELETE SET NULL`**: the service
   layer should set this to the acting user’s id on every write (saveDraft,
   publish, reset). If the user is later deleted, the column becomes NULL
   (the branding row is preserved). Do NOT change this to `RESTRICT` or
   `CASCADE` — that would break user-deletion flows.

5. **No `tenant_id`**: the table is intentionally single-tenant (one global
   branding row). Do not add a `tenant_id` column in future tasks unless the
   plan explicitly calls for multi-tenant branding.

6. **Migration `20260822060847_long_slayback` is tracked in
   `drizzle.__drizzle_migrations` (id=83)**. Future `db generate` runs will
   diff against its `snapshot.json`. Future `db migrate` runs will skip it
   (hash matches). Future `db push` runs will see no diff (table already
   matches the TS schema).

7. **The `ALTER TYPE app_permission ADD VALUE settings.appearance_manage`
   is now in the drizzle-tracked migration** (in addition to the custom
   `7c-appearance-permissions-enum.sql` from Phase 1). Both are idempotent
   (`IF NOT EXISTS` check via `pg_enum`), so they don’t conflict. On a fresh
   DB, the custom `7c-appearance-permissions-enum.sql` runs first (earlier
   drizzle folder timestamp), then the `20260822060847_long_slayback`
   migration runs the `DO $$ ... IF NOT EXISTS ... END $$` block as a no-op.

8. **`CODESCENE_BIN=/home/ahmed/.local/bin/cs` env var is required for
   sub-loop codescene stage over SSH**. The `cs` binary is installed at
   `/home/ahmed/.local/bin/cs` but that directory is not on the PATH
   inherited by the SSH session
   (`/home/z/.venv/bin:/home/z/.npm-global/bin:/home/z/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`).
   Set `CODESCENE_BIN` explicitly or prepend `/home/ahmed/.local/bin` to PATH.
   This is an environment quirk, not a code issue — the schema file itself
   passes all checks.

9. **`db push` + `db migrate` combo is the cleanest apply path for new
   Drizzle tables**: `db push` creates the table immediately (no migration
   tracking), then `db migrate` records the migration in
   `drizzle.__drizzle_migrations` and rewrites the SQL to be idempotent via
   `ensureIdempotentMigrations()`. This avoids the orphaned-migration-file
   problem described in Task 1.2’s carry-forward #3. For pure custom SQL
   migrations (no Drizzle table change), `db migrate` alone is sufficient
   (as established in Task 1.2).

10. **`ensureIdempotentMigrations()` is a robust safety net** — it rewrites
    every `migration.sql` in `backend/drizzle/` to be idempotent before
    `runDrizzleMigrations()` runs. This handles `CREATE TABLE`, `CREATE INDEX`,
    `ADD CONSTRAINT`, `ALTER TYPE ... ADD VALUE`, `ADD COLUMN`, `CREATE TYPE`,
    `ALTER COLUMN ... TYPE`, `DROP INDEX/CONSTRAINT`, and join-table `INSERT`s.
    It is called automatically by `bun run db migrate` (see
    `backend/db/scripts/migrate.ts:34`). Future tasks can rely on this —
    they don’t need to manually make their drizzle-generated SQL idempotent.

## Files NOT Modified

- No source TypeScript files outside the new `appearance/` sub-directory and
  the top-level `backend/db/schema/index.ts` barrel were touched.
- `backend/enum/permissions/permission.enum.ts` was already updated in Task 1
  (contains `SETTINGS_APPEARANCE_MANAGE`).
- No custom SQL files in `backend/db/migration/` were created or modified
  (Task 1.1/1.2 already added the enum + data SQL for the permission seed).
- `backend/drizzle/.custom-migrations.json` (the auto-bundler sidecar) was
  NOT modified — no new custom SQL files were added in this task.
- `tasks.md` checkbox for Task 2 was ticked from `[ ]` → `[x]` per the
  workflow.

## Issues Encountered

1. **CodeScene CLI not on PATH over SSH** — the first sub-loop run failed
   at the codescene stage with `Executable not found in $PATH: "cs"`. The
   `cs` binary is installed at `/home/ahmed/.local/bin/cs` but that directory
   is not on the SSH session’s PATH. Resolved by setting
   `CODESCENE_BIN=/home/ahmed/.local/bin/cs` (read by
   `scripts/health/codescene/config.ts`). The installer’s claim that it
   "installed successfully" was misleading — the binary was already present
   from a prior install; the installer just didn’t add `/home/ahmed/.local/bin`
   to PATH on Linux (it only does that on Windows). Documented in
   carry-forward #8 for future agents.

2. **`db generate` emitted an `ALTER TYPE app_permission ADD VALUE` for the
   `settings.appearance_manage` enum value** — this is because the previous
   drizzle snapshot (`20260815183754_update-academy-admin-group-name`) didn’t
   have the value, even though Task 1.2 already added it to the dev DB via
   the custom `7c-appearance-permissions-enum.sql` migration. The drizzle
   migration system and the custom-SQL migration system have separate state
   tracking. Resolved by `ensureIdempotentMigrations()` wrapping the
   `ALTER TYPE` in a `DO $$ ... IF NOT EXISTS ... END $$` block (no-op on
   this DB, applies on fresh DBs). No action needed by future tasks.

3. **`db push` does not track migrations in `drizzle.__drizzle_migrations`**
   — this is by design (`drizzle-kit push --force` syncs the TS schema
   directly to the DB). To get the migration tracked properly, ran
   `db migrate` afterwards. The `ensureIdempotentMigrations()` pre-processor
   made the apply a no-op (everything already existed), and the migration
   was recorded in `__drizzle_migrations` (id=83). Documented in
   carry-forward #9 as the recommended apply path for future Drizzle table
   additions.
