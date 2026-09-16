# S0-a — Environment Bootstrap + Phase 0 Baseline Outcome

- **Date**: 2026-08-27
- **Branch**: feat/student-credit-hours-system (HEAD `2e88b68db562696cabedf1abb33ed184238682e2`)
- **Agent**: S0-a general-purpose subagent (sandbox: DB_MODE=sqlite)

## Goal

Make `bun db:sqlite:push && bun db:sqlite:seed` fully succeed so browser QA has rich
realistic demo data, and capture a pre-implementation tooling baseline.

## Diagnosis (root cause)

The seed failure reported `empty tables: user_permission_groups, staff_profiles,
user_permission_overrides, staff_profile_files`. All four are **downstream** of
missing migration-owned system reference data:

1. `seed-users.ts` → `UserSeedService.upsertManyDemoUsers(demoInputs, groupMap)`
   only assigns users to permission groups when `groupMap.get(input.groupSlug)`
   resolves (`user_permission_groups`). Staff profiles (`staff_profiles` via
   `StaffProfileRepository.ensureForUser`, and consequently their avatar files in
   `staff_profile_files`) are created **only for staff-group users when that group id
   resolves**.
2. `auth/seed-user-permission-overrides.ts` requires the migration-owned
   `SUPPORT_SUBMIT_COMPLAINT` permission row to exist before inserting into
   `user_permission_overrides`; otherwise it logs a warning and returns empty.
3. Direct sqlite inspection of `./db/siraj.sqlite` after the failing seed:
   `permissions = 0`, `permission_groups = 0`, `group_permissions = 0`
   while `users = 40` — and crucially, **`__drizzle_migrations` did not exist**,
   i.e. the SQLite migration journal had never been applied.

Root cause: **the environment was built push-only.** `drizzle-kit push` syncs schema
but never applies `backend/drizzle-sqlite/20260824050000_system_bootstrap_data`
(the SQLite port of the system-permissions SQL, containing `INSERT OR IGNORE`
rows for permissions/groups/group_permissions). The documented quick start in
`docs/SQLITE_LOCAL_DEV.md` was itself push→seed, which produced this broken state.

Why migrate hadn't been run instead: the journal's DDL uses plain `CREATE TABLE`
(no `IF NOT EXISTS`), so running `bun db:sqlite:migrate` on an already-pushed
database would collide — the correct order is **migrate first on a fresh file,
then push to reconcile drift**.

## Fix applied

### Environment remediation (primary fix, no code change required for the data itself)

```bash
cp db/siraj.sqlite* /tmp/db-backup/          # safety backup of push-only state
rm -f db/siraj.sqlite db/siraj.sqlite-shm db/siraj.sqlite-wal
bun db:sqlite:migrate                         # fresh file: DDL + triggers + bootstrap data, journal marked (4 entries)
bun db:sqlite:push                            # additive reconciliation (adds package_plans missing from journal)
bun db:sqlite:seed                            # full demo dataset
```

### Code / doc changes

| File | Change |
|---|---|
| `backend/db/seeds/shared/verify-coverage.ts` | When coverage verification fails, fetch counts for the migration-owned anchor tables (`permissions`, `permission_groups`, `group_permissions`) and, if any are empty, log an actionable error stating migrations must be applied before seeding. Verification remains strict; nothing is masked. Previously this scenario surfaced only four confusing downstream table names. Validated end-to-end: push-only `.env.test` database now fails with both messages; migrated database passes with no behavior change. |
| `docs/SQLITE_LOCAL_DEV.md` | Quick-start steps 3–4 corrected to `migrate` (fresh file) → `push` (drift reconcile) → `seed`, explaining why push-only databases fail seed coverage. |
| `.env.test` | Created from `.env.sqlite`: `NODE_ENV=test`, `DB_FILE_NAME=./db/siraj-test.sqlite`; JWT/NEXTAUTH secrets byte-identical to `.env.sqlite`. |

Not modified: seed step list (`index.ts`), seeders themselves, services, AGENTS-mandated
ownership boundaries respected — permissions/group rows stay exclusively in migration SQL;
inserting them from `backend/db/seeds/**` is forbidden by `backend/db/seeds/AGENTS.md`.

## Verification results

| Command | Exit code | Evidence |
|---|---|---|
| `bun db:sqlite:migrate` (fresh `./db/siraj.sqlite`) | 0 | 4 journal rows in `__drizzle_migrations`; permissions=230, permission_groups=8, group_permissions=562, timezones=444 |
| `bun db:sqlite:push` (post-migrate) | 0 | additive only (created `package_plans`; reference-data counts unchanged) |
| `bun db:sqlite:seed` | 0 | "Seed coverage verification passed (72 tables)." |
| `bun db:sqlite:seed` (re-run) | 0 | idempotent re-run also passed coverage |
| admin login row query | confirmed | `admin@siraj.local`, `is_super_admin=1`, bcrypt `password` (60 chars, `$2b$12$…`), member of group slug `super_admin` via `user_permission_groups` |
| final counts | confirmed | user_permission_groups=40, staff_profiles=4, staff_profile_files=4, user_permission_overrides=1 |
| `.env.test` pipeline | 0 each | migrate/push/seed against `./db/siraj-test.sqlite`; admin row verified there too. Push-only negative test returned exit 1 with new diagnostic line firing. |
| sub-loop stages on `verify-coverage.ts` | see below | tsgo ✅ (no errors for this file) · oxlint ✅ · biome ✅ · lint:type-aware ✅ · duplicates ✅ (outside jscpd scope) · codescene ❌ environment |

## Per-file quality loop notes (sub-loop availability)

- Full-repo `tsgo -b --noEmit` is OOM-killed in this sandbox (exit 137, twice, incl.
  `GOMEMLIMIT=2800MiB GOGC=40` attempt; 4 GB RAM / 2 cores). The sub-loop's scoped tsgo
  stage did pass for the changed file ("tsgo passed (no errors for …)").
- `scripts/lint-service.ts` initially failed exit 127 because it spawns `$HOME/.bun/bin/bun`,
  absent here. Repaired by `ln -sf /usr/local/bin/bun /home/z/.bun/bin/bun` (sandbox-local).
  After repair, lint:type-aware passed for the changed file; two full-repo baseline lint
  attempts were terminated silently by the sandbox (~6-8 min in, no output, no exit code
  captured) — full-repo ESLint is not reliably runnable here, per-file runs are.
- codescene stage cannot run: requires `CS_ACCESS_TOKEN` (external service credential).
- Semantic review checklist applied manually: no race-prone writes added (diagnostic is
  read-only within existing failure branch); no module-level mutable state; comments and
  JSDoc contain no plan-artifact references (REQ-/Task/Phase/.ai/plans); no cross-layer
  imports introduced; enum/literal rules N/A; scope limited to files listed above.

## Carry-forward knowledge for future tasks

1. **SQLite env bootstrap order**: `migrate` (fresh file) → `push` → `seed`. Any future
   task creating a scratch/test sqlite DB must follow this; push-only databases will fail
   seed coverage with empty permission anchors (the verify-coverage error now says so explicitly).
2. `backend/drizzle-sqlite/` journal lags PG-side folders (e.g. `package_plans` arrived
   only via push). After adding schema, expect drift until a new sqlite folder is generated;
   keep using push as reconciliation before seeding.
3. Re-seeding regenerates deterministic demo data (fakerSeed=42, SEED_PROFILE default
   standard). Demo accounts live in `shared/demo-users.ts`; passwords resolve via
   `resolveAdminPassword()`; super admin is `admin@siraj.local`.
4. `.env.test` now exists and points tests at `./db/siraj-test.sqlite` (migrated + seeded,
   same secrets as `.env.sqlite`). Recreate it with `rm -f db/siraj-test.sqlite*` +
   migrate→push→seed if test runs corrupt it.
5. Sandbox quirks: `/home/z/.bun/bin/bun` symlink required by lint-service/tsgo wrappers;
   full-repo tsgo OOMs (use sub-loop's filtered tsgo stage per file); cs CLI needs token.
6. Backup of pre-fix push-only database kept at `/tmp/db-backup/` (external to repo).
