## Section 5: Prerequisites Verification (BLOCKING)

All items in this section must be verified **before executing any task in Story 12**. If any item is not verified, the corresponding prerequisite must be established before proceeding. Story 12 relies on the existence of the Learning Resources uploading infrastructure (implemented in previous parts) and the base Class Instances execution tracking.

---

### 5.0 Security Artifact Verification (Baseline)

Story 12's destructive features and financial masking depend entirely on the existing user authorization modules. The following baseline artifacts must be verified to exist in the current branch:

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Drizzle DB connection | `backend/db/index.ts` | `bun tsgo` | Exists and provides the `db` singleton ✅ |
| `PermissionsService.hasPermission()` | `backend/services/auth/permissions.service.ts` | Code review | Method exists, checks DB or Context for auth claims ✅ |
| Base GraphQL Pothos schema | `backend/graphql/pothos/builder.ts` | `bun codegen` | Builder is configured and operational ✅ |
| Core UI Components | `frontend/components/ui/` | Visual check | `Button`, `Dialog`, `Snackbar`, `DataGrid` components exist ✅ |

**If any core baseline artifact is missing or failing, Story 12 is BLOCKING until the base branch is stabilized.**

---

### 5.1 Database Schema Verification

All schema columns used by Story 12's reporting already exist in the database. 

#### `learning_resources` table (`backend/db/schema/communications.ts`):

- [ ] `id: uuid` primary key exists.
- [ ] `filePath: varchar` column exists storing the S3/storage path.
- [ ] `uploadedByUserId: uuid` column exists tracking the owner.
- [ ] `deletedAt: timestamp` column exists (even though we perform hard deletions, validating the schema structure is key).

#### `class_instances` table (`backend/db/schema/scheduling.ts`):

- [ ] `executionState: classExecutionStateEnum` column exists.
- [ ] `studentId` foreign key exists.
- [ ] `teacherId` foreign key exists.
- [ ] `scheduledStartAt` and `scheduledEndAt` timestamp columns exist.
- [ ] `durationMinutes` integer column exists.

#### `users` and `teachers` tables:

- [ ] `teachers.userId` foreign key exists linking to `users.id`.
- [ ] `users.name` column exists.
- [ ] `teachers.hourlyRate` column exists (critical for financial `paidEGP` / `paidUSD` math aggregations).

---

### 5.2 Migration Verification

- [ ] Check if `backend/db/migration/` contains the latest baseline scripts.
- [ ] `academy_admin` group exists in the migration files at slug `academy_admin`.
- [ ] Story 12 permissions are NOT yet in the migration (need to be added by Task A).
  - `resources.delete` — ❌ (not verified — missing, needs creation in Task A)
  - `report.generate_custom` — ❌ (not verified — missing, needs creation in Task A)
  - `report.view_financials` — ❌ (not verified — missing, needs creation in Task A)

---

### 5.3 Test Suite Verification

Run before starting Task A to establish baseline:

```bash
# 1. Verify all database tests pass
bun run test:db

# 2. Verify all GraphQL tests pass
bun run test:graphql

# 3. Verify TypeScript compiles without errors
bun tsgo

# 4. Verify linting passes
bun biome:check
bun lint
```

**Expected output:** 0 failures, 0 errors, 0 warnings across all commands. If any command fails, fix the pre-existing issue before proceeding. Story 12 tasks must not introduce regressions on a broken main branch.

---

### 5.4 Existing Code Verification

#### Backend Services:

- [ ] `StorageService.deleteFile()` exists and is accessible for physical file destruction.
- [ ] `PermissionsService.hasPermission()` exists.
- [ ] `getBackendTranslations()` is available in `backend/lib/intl.ts`.

#### Drizzle Imports:

- [ ] `gte`, `lte`, `and`, `eq`, `isNull`, `inArray`, `sum`, `count` are available from `drizzle-orm`.

---

### 5.5 Pre-Execution Checklist

Before executing Task A, confirm all of the following:

- [ ] `bun run test:db` passes with 0 failures ✅
- [ ] `bun run test:graphql` passes with 0 failures ✅
- [ ] `bun tsgo` passes with 0 errors ✅
- [ ] `bun biome:check` passes with 0 issues ✅
- [ ] `bun lint` passes with 0 issues ✅
- [ ] `resources.delete` is absent from migration (correct pre-condition) ✅
- [ ] `report.generate_custom` is absent from migration (correct pre-condition) ✅
- [ ] `report.view_financials` is absent from migration (correct pre-condition) ✅

**If all items are confirmed, proceed to [Task A](./section-6-tasks/task-a-migration-enum.md).**
