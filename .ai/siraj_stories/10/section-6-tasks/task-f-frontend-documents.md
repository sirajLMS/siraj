### Task F — Frontend GraphQL Documents: `statusTrackingScheduleQueryDocument`

**Objective:** Add the `statusTrackingScheduleQueryDocument` Apollo TypedDocumentNode to the frontend's shared document set, enabling `StatusTrackingContainer` (Task H) to use `useQuery` with full TypeScript type safety.

**Dependencies:** Depends on Task E — the `statusTrackingSchedule` query must be registered in the backend GraphQL schema AND codegen must have been run successfully to generate `Operations.StatusTrackingScheduleQuery` and `Types.QueryStatusTrackingScheduleArgs` in `frontend/graphql/generated/gql/graphql-types.ts`.

**Layer-Specific Rules (Frontend GraphQL — Flattened from frontend/graphql/AGENTS.md):**
- One file per domain: `schedule.documents.ts` already exists — add to it, do NOT create a new file.
- Import from `"@apollo/client"` — never from `"@apollo/client/core"`.
- TypedDocumentNode naming convention: `<camelCaseName>QueryDocument` for queries.
- Every selection set must include `id` on every named object type for Apollo cache normalization — `StatusTrackingScheduleRow` includes `id`.
- **NO `useLazyQuery`** — use stateful `useQuery` exclusively (enforced in container, not in document file).
- **🚫 NO DB/Repo Imports** — frontend GraphQL documents only import from generated Apollo types.

**Target Files:**
- `frontend/graphql/sharedDocuments/schedule.documents.ts` (Modify — add new document at end)
- `frontend/graphql/sharedDocuments/index.ts` — Already exports `schedule.documents.ts`. No change needed.

---

**Detailed Implementation Steps:**

### Step 1: Verify Codegen Output Before Proceeding

Before modifying `schedule.documents.ts`, verify that Task E's codegen run produced the necessary generated types:

```bash
# Verify StatusTrackingScheduleQuery type was generated
grep -n "StatusTrackingScheduleQuery\|QueryStatusTrackingScheduleArgs\|statusTrackingSchedule" \
  frontend/graphql/generated/gql/graphql-types.ts
```

**Expected output:** Multiple lines showing:
- `StatusTrackingScheduleQuery` — the query operation return type
- `QueryStatusTrackingScheduleArgs` — the query arguments type
- `StatusTrackingScheduleRow` — the GraphQL object type

If these are NOT present, re-run codegen from Task E:
```bash
bun run generate:gqlSchema
bun codegen
```

### Step 2: Understand the Existing `schedule.documents.ts` Structure

Before adding to the file, read the existing document file to understand its structure:
- What imports are at the top (`gql`, `TypedDocumentNode`, `Operations`, `Types`)
- What existing documents are defined (e.g., `dailyScheduleQueryDocument`, `rescheduleTrackingQueryDocument`)
- The naming and typing patterns used

The file likely has a pattern like:
```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
```

### Step 3: Add `statusTrackingScheduleQueryDocument` to `schedule.documents.ts`

Add at the END of `frontend/graphql/sharedDocuments/schedule.documents.ts`:

```typescript
// ─── Status Tracking Schedule Query ───────────────────────────────────────────

/**
 * Fetches all class instances for the status tracking admin dashboard.
 *
 * Returns class rows for a given date, enriched with student status and
 * isFrozen flag. Used by StatusTrackingContainer to display real data
 * with correct session status badges and action button states.
 *
 * Permission required: SCHEDULE_VIEW_ALL or DASHBOARD_VIEW_METRICS
 * (checked in ScheduleQueryService — unauthorized actors get an error)
 *
 * @param date - ISO date string (YYYY-MM-DD) for which to fetch classes
 * @param search - Optional search filter (matches student name or teacher name)
 * @param viewerTimezone - Optional IANA timezone for day boundary calculation
 */
export const statusTrackingScheduleQueryDocument: TypedDocumentNode<
  Operations.StatusTrackingScheduleQuery,
  Types.QueryStatusTrackingScheduleArgs
> = gql`
  query statusTrackingSchedule($date: String!, $search: String, $viewerTimezone: String) {
    statusTrackingSchedule(date: $date, search: $search, viewerTimezone: $viewerTimezone) {
      id
      studentId
      studentName
      studentInitials
      studentStatus
      teacherId
      teacherName
      scheduledStartAt
      scheduledEndAt
      durationMinutes
      executionState
      outcome
      isFrozen
    }
  }
`;
```

**Selection set notes:**
- `id` is included first — required for Apollo cache normalization
- `studentId` — included for future use (navigating to student profile, etc.)
- `studentInitials` — pre-computed on backend to avoid client-side string manipulation
- `studentStatus` — used in `mapToSessionStatus()` to determine badge type
- `teacherId` — included for future use
- `scheduledStartAt` and `scheduledEndAt` — used to compute `schedule` string for display
- `durationMinutes` — included for future timeline display
- `executionState` — used in `mapToSessionStatus()` for `pending_verification` status
- `outcome` — included for audit/reporting display
- `isFrozen` — critical: determines if action buttons should be hidden (suspended_pending status)

**All 13 fields from `StatusTrackingScheduleRow` are included.** No field is omitted.

### Step 4: Verify Index Export (No Change Needed)

Check that `frontend/graphql/sharedDocuments/index.ts` already exports `schedule.documents.ts`:

```bash
grep "schedule.documents" frontend/graphql/sharedDocuments/index.ts
```

**Expected:** One line showing the export (e.g., `export * from "./schedule.documents";`).

If the export is NOT present, add it:
```typescript
export * from "./schedule.documents";
```

From the verified facts in Section 5, this export already exists — so no change is needed.

### Step 5: Verify TypeScript Types Are Correct

After adding the document, verify that TypeScript accepts the typed document:

```bash
bun tsgo
```

Common issues to watch for:
- `Operations.StatusTrackingScheduleQuery` — if this type is not found, codegen did not run or the query name differs from the generated type name
- `Types.QueryStatusTrackingScheduleArgs` — if this type is not found, check that `QueryStatusTrackingScheduleArgs` matches exactly (not `QueryStatusTrackingScheduleArgs` with different casing)
- `gql` template tag — verify it's imported from `"@apollo/client"` (not `"graphql-tag"`)

If generated type names don't match, re-check the generated file:
```bash
grep -n "StatusTracking" frontend/graphql/generated/gql/graphql-types.ts
```

### Step 6: Verify the Complete Document Export Chain

```bash
# 1. Verify document is defined in schedule.documents.ts
grep -n "statusTrackingScheduleQueryDocument" frontend/graphql/sharedDocuments/schedule.documents.ts

# 2. Verify index.ts exports schedule.documents.ts
grep "schedule.documents" frontend/graphql/sharedDocuments/index.ts

# 3. Verify the document is importable from the index
grep -rn "statusTrackingScheduleQueryDocument" frontend/views/ frontend/graphql/
```

**Expected for step 3:** Only the definition in `schedule.documents.ts` — no consumers yet (Task H will add the import in `StatusTrackingContainer`).

---

**Test Execution Requirements:**

```bash
# TypeScript compilation — catches type mismatches immediately
bun tsgo

# Biome linting
bun biome:check

# ESLint
bun lint

# Run GraphQL tests (existing tests should still pass)
bun run test:graphql
```

**Note:** New GraphQL tests for `statusTrackingSchedule` will be added in Task G.

---

**Success Criteria / Check Progress Points:**

- [ ] `statusTrackingScheduleQueryDocument` constant exported from `schedule.documents.ts`
- [ ] Typed as `TypedDocumentNode<Operations.StatusTrackingScheduleQuery, Types.QueryStatusTrackingScheduleArgs>`
- [ ] All 13 fields included in the selection set (including `id` for cache normalization)
- [ ] `gql` imported from `"@apollo/client"` (not from `"graphql-tag"`)
- [ ] Query GQL string matches the backend resolver's expected arguments: `$date: String!`, `$search: String`, `$viewerTimezone: String`
- [ ] `frontend/graphql/sharedDocuments/index.ts` already exports `schedule.documents.ts` (no change needed to index)
- [ ] `bun tsgo` passes with 0 TypeScript errors related to the new document
- [ ] `bun codegen` was run successfully in Task E (prerequisite — generated types exist)
- [ ] `bun run test:graphql` passes with 0 failures (no regressions from document addition)

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
