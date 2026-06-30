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

### Step 1: Add `TEST_CUSTOM_ALT` enum value

**File**: `shared/lib/enum.ts`
- Add `TEST_CUSTOM_ALT = "test.custom_alt"` after `TEST_CUSTOM_ONLY` (line 539)

**New migration**: `backend/db/migration/<N>-add_test_custom_alt_permission.sql`
```sql
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'test.custom_alt';
```

### Step 2: Add `createTestPermission` helper to `entity-setup.ts`

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

### Step 3: Fix `repo/permission-management.repository.test.ts`

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

### Step 4: Fix `logic/permission-management.service.test.ts`

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

### Step 5: Add comments to `repo/permissions.test.ts`

**File**: `backend/db/test/repo/permissions.test.ts`

**No code changes** — these tests intentionally verify DB trigger constraints on `isSystem=true` entities which cannot be created. Add explanatory comments:

- Line 34: `// Uses seed system permission — required: testing DB trigger that only applies to isSystem=true entities`
- Line 38: `// Uses seed system group — required: testing DB trigger that only applies to isSystem=true entities`
- Line 45: `// Operates on seed auth.login permission — required: trigger test target`
- Line 51: `// Operates on seed super_admin group — required: trigger test target`

---

## Files to Modify

| # | File | Type | Changes |
|---|------|------|---------|
| 1 | `shared/lib/enum.ts` | Enum | Add `TEST_CUSTOM_ALT` |
| 2 | `backend/db/migration/<N>-add_test_custom_alt_permission.sql` | New | ALTER TYPE migration |
| 3 | `backend/db/test/entity-setup.ts` | Helper | Add `createTestPermission()` |
| 4 | `backend/db/test/repo/permission-management.repository.test.ts` | Test | Fix 5 seed queries + wrap non-tx test |
| 5 | `backend/db/test/logic/permission-management.service.test.ts` | Test | Fix 2 seed queries + wrap trigger tests |
| 6 | `backend/db/test/repo/permissions.test.ts` | Test | Add explanatory comments only |

---

## What Stays the Same (documented justification)

Tests that **must** query seed data because their entire purpose is to verify DB triggers on `isSystem=true` entities:

- `permissions.test.ts` — all 10+ system permission/group trigger tests
- L195,257 in `repo/permission-management.repository.test.ts` — system group update/delete constraints
- L200,212,266 in `logic/permission-management.service.test.ts` — system group constraints at service layer

Each gets an explicit comment: `// Uses seed system group — required: DB trigger prevents creating isSystem=true groups`

---

## Verification Plan

After all changes, run each modified test file through the `run-test` script:

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
bun run lint                # ESLint
```

### After migration is applied

```bash
# Run the migration (check with `bun run db` for migration commands)
# Then re-run the full test suite
bun run scripts/run-test/run-test.ts backend/db/test/repo/permission-management.repository.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/logic/permission-management.service.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/repo/permissions.test.ts
```

---

## Rollback Plan

If the `TEST_CUSTOM_ALT` enum addition causes issues:
1. The migration is additive only (no data changes, no column changes)
2. Revert by removing the enum value (requires a new migration or manual `ALTER TYPE ... REMOVE`)
3. Existing `TEST_CUSTOM_ONLY` usage is unaffected
