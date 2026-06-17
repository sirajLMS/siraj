# Agents Instructions

When creating or updating a seeder in this directory, you must adhere to the following rules:

- **"seed or get" Pattern:** Every seeder MUST export a function named `seedOrGet`.
- **One Seeder per Table**: Every table must have its own dedicated seeder file (e.g., `seed-classes.ts`, `seed-class-instances.ts`). Do not combine distinct domains.
- **Idempotency:** The `seedOrGet` function must be safely runnable multiple times. It should not create duplicate records (use `onConflictDoUpdate`, `onConflictDoNothing`, or similar mechanisms).
- **Return Value:** The function should return the seeded or retrieved entities. This allows other seeders to use those entities without querying the database again.
- **Dependencies via Controller Context:** If your seeder depends on data seeded by another seeder, the results should be passed from the master seeder controller (`index.ts`) through context, calling that seeder's `seedOrGet` function or accepting it as a parameter.

This ensures that we avoid duplicating data (such as permission groups or users) even if seeders are run multiple times.

- **Check Constraints:** Ensure your seeded data respects database-level `CHECK` constraints (e.g. `class_instances_state_machine_chk`). Check `backend/db/schema/*.ts` for these constraints to prevent seeding failures.
- **Enums Verification:** PostgreSQL enums must be matched EXACTLY. Check the `backend/db/schema/enums.ts` or `shared/lib/enum.ts` for the correct values (e.g., using `"ACTIVATED"` or `"REGULAR"` instead of `"ACTIVE"`). Do not guess valid statuses.
- **Schema Synchronization:** If you modified the database schema during your task (e.g., adding a column like `avatar_url`), you MUST run `bun run scripts/dbActions.ts push` (or `bun run db push`) to apply changes to the local database before running `bun run db seed`.
- **Drizzle Type Safety:** When querying inside seeders to check for existing records, favor `db.select().from(table).where(...)` instead of `db.query.table.findFirst({ where: ... })` if you encounter strict typing issues with relational queries. If strict `Entity` types are unavailable for dependency injection, you must create new types under `backend/types/` in the specified type file (one type per table) and update `backend/types/index.ts` accordingly, instead of using inline types or `any`.
