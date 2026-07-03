# Plan: Fix DB Tests — Eliminate Seed Data Dependencies

## Problem

Several database tests query for pre-existing seed data instead of creating their own test entities, violating Rule 15 of `backend/db/test/AGENTS.md`:

> Tests MUST create their own data using entity-setup helpers inside the `runInRollback` transaction. NEVER query the database for pre-existing seed data.

## Root Cause Analysis

The violations fall into two categories:

1. **Fixable**: Tests that query seed permissions/groups out of convenience (not necessity) — they just need any valid permission/group ID
2. **Unavoidable**: Tests that verify DB trigger constraints on `isSystem=true` entities which cannot be created programmatically (the trigger `protect_system_permissions()` blocks `INSERT ... is_system = true`)

## Constraint: PostgreSQL Enum on Permission Keys

The `permissions.key` column uses a PostgreSQL enum type `app_permission` that only allows predefined `AppPermission` values. We cannot use `randomUUID()` for permission keys. Two test-specific enum values exist:

- `TEST_CUSTOM_ONLY = "test.custom_only"` — can be inserted with `isSystem=false`
- `TEST_SYSTEM_ONLY = "test.system_only"` — exists for trigger constraint tests

We need a **second** custom test permission key for tests that need 2 distinct permissions.

---

## Implementation Steps

> **Migration constraint**: Steps 1 and 2 modify the DB schema/migrations and MUST be executed sequentially in a single subagent (not in parallel). After each schema/migration modification, run `bun db cleanGenerate` immediately to verify no cascading issues accumulate. This verification must happen **before** any other subagents are dispatched for test-only changes.

### Step 1: Add `TEST_CUSTOM_ALT` enum value [depends on: nothing]

**File**: `shared/lib/enum.ts`
- Add `TEST_CUSTOM_ALT = "test.custom_alt"` after `TEST_CUSTOM_ONLY` (line 539)

**New migration**: `backend/db/migration/<N>-add_test_custom_alt_permission.sql`
```sql
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'test.custom_alt';
```

**Immediately after**: Run `bun db cleanGenerate` to confirm the enum + migration apply cleanly. Fix any errors before proceeding to Step 2.

### Step 2: Add `createTestPermission` helper to `entity-setup.ts` [depends on: Step 1 ✅]

**File**: `backend/db/test/entity-setup.ts`

Add a new globally-reusable helper (per Rule 10):

```typescript
export async function createTestPermission(
  tx: DBTransaction,
  key: AppPermission,
  overrides: Partial<typeof permissions.$inferInsert> = {}
): Promise<typeof permissions.$inferSelect> {
  const [perm] = await tx
    .insert(permissions)
    .values({
      key,
      resource: "test",
      action: "test_action",
      description: "Test permission",
      category: "Test",
      isSystem: false,
      ...overrides,
    })
    .returning();
  return perm;
}
```

**Immediately after**: Run `bun db cleanGenerate` again to confirm the helper doesn't introduce schema/type drift. Fix any errors before proceeding. **Phase 1 gate: this must pass before any Phase 2 subagent is dispatched.**

### Step 3: Fix `repo/permission-management.repository.test.ts` [depends on: Step 2 ✅]

| Lines | Current Issue | Fix |
|-------|--------------|-----|
| 86 | Queries seed system group for `getGroupById` | Create a custom group via `createGroup()`, then test `getGroupById` on that group's ID |
| 104 | `tx.select().from(permissions).limit(1)` for createGroup | Replace with `createTestPermission(tx, AppPermission.TEST_CUSTOM_ONLY)` |
| 141 | `tx.select().from(permissions).limit(2)` for updateGroup | Replace with two `createTestPermission` calls: `TEST_CUSTOM_ONLY` and `TEST_CUSTOM_ALT` |
| 195 | Queries seed system group for updateGroup constraint | **Keep with comment**: `// Uses seed system group — required: DB trigger prevents creating isSystem=true groups` |
| 257 | Queries seed system group for deleteGroup constraint | **Keep with comment**: same |
| 355 | `tx.select().from(permissions).limit(2)` for overrides engine | Replace with two `createTestPermission` calls |
| 408-464 | Non-tx coverage test without `runInRollback` | Wrap in `runInRollback`, pass `tx` to all repo calls, remove manual cleanup |

**For the non-tx coverage test (lines 408-464):**
- Wrap entire test body in `runInRollback`
- Pass `tx` to ALL `PermissionManagementRepository` method calls (per Rule 16 — check each method's `tx` parameter position)
- Remove the `db.delete(users)` cleanup and the `db.transaction` sub-transaction for creating temp user
- Use `createTestUser(tx)` directly inside the rolled-back transaction

### Step 4: Fix `logic/permission-management.service.test.ts` [depends on: Step 1 ✅]

| Lines | Current Issue | Fix |
|-------|--------------|-----|
| 162 | `db.select().from(permissions).limit(1)` for createGroup slug test | Insert `TEST_CUSTOM_ONLY` permission in `beforeAll`, store as `testPerm1` |
| 390 | `db.select().from(permissions).limit(2)` for overrides/effective perms | Insert both `TEST_CUSTOM_ONLY` and `TEST_CUSTOM_ALT` in `beforeAll`, store as `testPerm1`, `testPerm2` |
| 200 | Queries seed system group — updateGroup constraint | **Keep with comment** |
| 212 | Queries seed system group — deleteGroup constraint | **Keep with comment** |
| 266 | Queries seed system group — revokeGroupFromUser constraint | **Keep with comment** |
| 280-325 | Trigger tests use `db` directly without `runInRollback` | Wrap in `runInRollback`; remove manual `db.delete(permissions)` cleanup on line 321 |

**For service test permission setup:**
- Add `testPerm1` and `testPerm2` variables alongside existing `adminUser`/`regularUser`/`superAdminUser`
- Insert both in `beforeAll` using `db.insert(permissions).values({...})`
- Clean up in `afterAll` using `db.delete(permissions).where(eq(permissions.key, AppPermission.TEST_CUSTOM_ONLY))` (and same for `TEST_CUSTOM_ALT`)
- Use `onConflictDoNothing` to handle re-runs

### Step 5: Add comments to `repo/permissions.test.ts` [depends on: nothing]

**File**: `backend/db/test/repo/permissions.test.ts`

**No code changes** — these tests intentionally verify DB trigger constraints on `isSystem=true` entities which cannot be created. Add explanatory comments:

- Line 34: `// Uses seed system permission — required: testing DB trigger that only applies to isSystem=true entities`
- Line 38: `// Uses seed system group — required: testing DB trigger that only applies to isSystem=true entities`
- Line 45: `// Operates on seed auth.login permission — required: trigger test target`
- Line 51: `// Operates on seed super_admin group — required: trigger test target`

---

## Task Dependency Graph

```
Step 1 (enum + migration)
  └─▶ Step 2 (entity-setup helper)          [depends on Step 1: imports AppPermission.TEST_CUSTOM_ALT]
       └─▶ Step 3 (repo test fixes)          [depends on Step 2: uses createTestPermission()]
       └─▶ Step 4 (service test fixes)       [depends on Step 1: uses AppPermission.TEST_CUSTOM_ALT]
       └─▶ Step 5 (comments only)            [no dependencies, but grouped with Phase 2]
```

### Dependency Rules

| Step | Depends On | Cannot Start Until |
|------|-----------|-------------------|
| 1 | — | Can start immediately |
| 2 | Step 1 | Step 1's `bun db cleanGenerate` passes |
| 3 | Step 2 | Step 2's `bun db cleanGenerate` passes (needs `createTestPermission` helper to exist) |
| 4 | Step 1 | Step 1's `bun db cleanGenerate` passes (needs `TEST_CUSTOM_ALT` enum value to exist) |
| 5 | — | Can start anytime, but grouped in Phase 2 for efficiency |

## Execution Order & Subagent Strategy

### Phase 1: Schema & Helper (MUST be sequential, single subagent)

Steps 1 → 2 must run sequentially in **one subagent** because:
- Step 2 depends on Step 1's enum value existing
- Both modify schema/migration files requiring `bun db cleanGenerate` verification

**Gate**: Phase 1 is not "done" until BOTH `bun db cleanGenerate` runs pass. The main agent must confirm this before dispatching Phase 2 subagents.

### Phase 2: Test Fixes (parallel subagents, each knows its dependencies)

| Step | Subagent | Prerequisite Check (subagent MUST verify before starting) |
|------|----------|----------------------------------------------------------|
| 3 | Subagent A | `import { createTestPermission } from '@/backend/db/test/entity-setup'` resolves — if not, abort and report: "Step 2 not complete" |
| 4 | Subagent B | `AppPermission.TEST_CUSTOM_ALT` exists in `shared/lib/enum.ts` — if not, abort and report: "Step 1 not complete" |
| 5 | Subagent C | No prerequisite check needed |

Each Phase 2 subagent must:
1. **Verify its dependency exists** before making any file changes
2. If dependency is missing, **abort immediately** with a clear message — do not attempt partial changes
3. If dependency exists, proceed with its task

## Files to Modify

| # | File | Type | Phase | Step | Depends On | Changes |
|---|------|------|-------|------|------------|---------|
| 1 | `shared/lib/enum.ts` | Enum | Phase 1 | 1 | — | Add `TEST_CUSTOM_ALT` |
| 2 | `backend/db/migration/<N>-add_test_custom_alt_permission.sql` | New migration | Phase 1 | 1 | — | ALTER TYPE migration |
| 3 | `backend/db/test/entity-setup.ts` | Helper | Phase 1 | 2 | Step 1 | Add `createTestPermission()` |
| 4 | `backend/db/test/repo/permission-management.repository.test.ts` | Test | Phase 2 | 3 | Step 2 | Fix 5 seed queries + wrap non-tx test |
| 5 | `backend/db/test/logic/permission-management.service.test.ts` | Test | Phase 2 | 4 | Step 1 | Fix 2 seed queries + wrap trigger tests |
| 6 | `backend/db/test/repo/permissions.test.ts` | Test | Phase 2 | 5 | — | Add explanatory comments only |

---

## What Stays the Same (documented justification)

Tests that **must** query seed data because their entire purpose is to verify DB triggers on `isSystem=true` entities:

- `permissions.test.ts` — all 10+ system permission/group trigger tests
- L195,257 in `repo/permission-management.repository.test.ts` — system group update/delete constraints
- L200,212,266 in `logic/permission-management.service.test.ts` — system group constraints at service layer

Each gets an explicit comment: `// Uses seed system group — required: DB trigger prevents creating isSystem=true groups`

---

## Verification Plan

### Phase 1: Schema & Migration Verification (sequential, single subagent)

After each modification in Phase 1, run `bun db cleanGenerate` immediately to confirm no cascading issues:

```bash
# After Step 1 (enum + migration):
bun db cleanGenerate

# After Step 2 (entity-setup helper — confirm no type drift):
bun db cleanGenerate
```

If either `cleanGenerate` fails, fix the issue and re-run before proceeding. **Phase 2 must not start until Phase 1 completes successfully.**

### Phase 2: Test Verification (parallel subagents)

After Phase 1 succeeds, run each modified test file through the `run-test` script:

```bash
# Run each modified test
bun run scripts/run-test/run-test.ts backend/db/test/repo/permission-management.repository.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/logic/permission-management.service.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/repo/permissions.test.ts

# Verify results
bun run scripts/run-test/run-test.ts --last backend/db/test/repo/permission-management.repository.test.ts
bun run scripts/run-test/run-test.ts --last backend/db/test/logic/permission-management.service.test.ts
bun run scripts/run-test/run-test.ts --last backend/db/test/repo/permissions.test.ts

# If any failures, focus on specific failing tests
bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <path>
```

### Quality Gates

After all test changes:

```bash
bun tsgo                    # Type checking
bun biome:check             # Formatting/lint
# Lint via queue client (NEVER run `bun run lint` directly):
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"fix-db-tests","files":["<files>"]}'
```

---

## Rollback Plan

If the `TEST_CUSTOM_ALT` enum addition causes issues:
1. The migration is additive only (no data changes, no column changes)
2. Revert by removing the enum value (requires a new migration or manual `ALTER TYPE ... REMOVE`)
3. Existing `TEST_CUSTOM_ONLY` usage is unaffected
