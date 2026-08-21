# GraphQL Codegen Consolidation Plan v3

## Goal

Single `graphql.ts` file with:
- Native TS enums (`enumType: "native"`)
- Operation result types + variables types
- Named extracted field types (via `extractAllFieldsToTypesCompact: true`)
- Document nodes (via `typed-document-node` plugin)
- No schema-level object types (no `typescript` plugin)
- No `graphql-types.ts`, no `operations.ts`, no `gql.ts`, no `fragment-masking.ts`

## Strict Rules (NO EXCEPTIONS)

1. **NO MAPPING**: No type mapping functions, no intermediate mapping layers, no manual conversion between types. Consumers must use the exact codegen-generated types directly. If a type mismatch occurs, fix the GraphQL query/document to select the right fields — never create a mapping function.
2. **NO SCHEMA TYPES**: No schema-level object types (e.g., `User`, `Quota`). Only operation-derived types (e.g., `MeQuery_me`, `QuotaQuery_quota`). If a consumer needs a type that doesn't exist in `graphql.ts`, the query document must be updated to select those fields.
3. **NO HARDCODED TYPES**: Never redefine or hardcode types that should come from codegen. If codegen doesn't emit a needed type, fix the codegen config or the document — don't create a local type.
4. **NO INDEXED-ACCESS TYPES**: No `NonNullable<MeQuery["me"]>` or similar indexed-access workarounds. Use the named extracted type directly (e.g., `MeQuery_me`).
5. **SINGLE SOURCE**: All imports must come from `@/frontend/common/graphql/generated/gql/graphql`. No importing from deleted files (`graphql-types.ts`, `operations.ts`).

## Current State (Pre-Execution Baseline)

### Generated Files
| File | Status | Lines | Types | Enums | Notes |
|------|--------|-------|-------|-------|-------|
| `graphql.ts` | Active (client preset) | 5,088 | 755 | 74 | NO extracted field types — client preset silently ignores `extractAllFieldsToTypes` |
| `graphql-types.ts` | DELETED | — | — | — | Was 7,436 lines with 647 schema types |
| `operations.ts` | DELETED | — | — | — | Was 6,450 lines with 191 consumers |
| `gql.ts` | Exists, 0 consumers | 5,045 | — | — | `gql` function, safe to delete |
| `fragment-masking.ts` | Exists, 0 consumers | ~100 | — | — | `FragmentType`, safe to delete |
| `index.ts` | `export * from "./gql"` | 1 | — | — | Update to `export * from "./graphql"` or delete |

### Consumer Files
| Import Pattern | Files | Fix Method |
|---------------|-------|------------|
| `import from "gql/graphql-types"` | 18 | Sed: `gql/graphql-types` → `gql/graphql` |
| `import from "gql/operations"` | 3 | Sed: `gql/operations` → `gql/graphql` |
| `import * as Types from "gql/graphql"` | 1 | Subagent: `Types.ClassMeetingConfig` → extracted type |
| `import * as Operations from "gql/graphql"` | 37 | Sed: remove `Operations.` prefix, use named imports |
| Schema type references (e.g., `User`, `Quota`) | ~100+ | Subagent: replace with extracted field type |

### tsgo Baseline (Current — Before Phase 0b)
- **223 errors across 143 files**
- TS2305 (85): Module has no exported member — schema type names
- TS2724 (85): No exported member named — schema type names and wrong extracted names
- TS2307 (21): Cannot find module — `gql/graphql-types` / `gql/operations` paths
- TS7006 (13): Implicit any — cascade
- TS2322 (10): Type mismatch — cascade
- TS2694 (5): Namespace member not exported — default-mode extracted names
- TS7053 (2): Implicit any indexing
- TS2741 (2): Missing properties

**IMPORTANT**: This baseline is BEFORE Phase 0b (codegen regeneration). After Phase 0b regenerates `graphql.ts` with compact extracted field types, the available type names will change. The error list must be re-captured after Phase 0b to get the real list for subagent dispatch.

### Missing Type Names (Current Baseline)

**Schema-level names (TS2305/TS2724)** — will be replaced by compact extracted types:
`AdminNoteInfo`, `ClassCategory`, `ClassInstanceDetail`, `ClassInstanceStudentInfo`, `ClassInstanceTeacherInfo`, `ClassSubject`, `CommunicationLogEntry`, `Complaint`, `ComplaintMetrics`, `ComplaintResponse`, `EffectiveMeeting`, `FutureClass`, `GroupClassStudent`, `GroupUser`, `OnlineMeetingInfo`, `Permission`, `PermissionGroup`, `Quota`, `QuotaLedger`, `Suggestion`, `SuggestionMetrics`, `User`, `UserOverride`

**Wrong extracted names (TS2694/TS2724)** — default-mode names that compact mode will name differently:
`AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint`, `AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_metrics_DailyScheduleMetrics`, `AdminSuggestionResult`, `ClassMeetingConfig`, `ComplaintQueueResult`, `CurrencyHedgesQuery_Query`, `DailyScheduleList`, `GroupClassAudit`, `LearningResourceRow`, `ManagerDirectoryMetrics`, `ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult`, `ParentOnboardingResult`, `RescheduleTrackingRow`, `SimulatablePermissionGroup`, `StatusTrackingScheduleRow`, `TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult_rows_TeacherAssignedClass`, `TeacherAssignedStudentsQuery_teacherAssignedStudents_TeacherAssignedStudentsResult_rows_TeacherAssignedStudent`, `TeacherDirectoryMetrics`, `TeacherDirectoryRow`, `TeacherDashboardQuery_teacherDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics`, `TeacherDashboardQuery_teacherDashboard_TeacherDashboard_progressFeed_TeacherProgressFeedItem`, `TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_importantNotes_TeacherImportantNote`, `TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_supportContact_SupportContact`, `TeacherOnboarding`, `TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass`, `TeacherWorkloadMetricsQuery_teacherWorkloadMetrics_WeeklyWorkloadMetrics`, `UserMeetingConfig`, `QuotasQuery_quotas_QuotaPaginatedResult_rows_Quota`, `StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics`, `StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession`, `StudentQuotasQuery_studentQuotas_Quota`, `CronRunsQuery_cronRuns_CronPaginatedRuns_rows_CronRun`, `SettingsAuditLogsQuery_settingsAuditLogs_SettingsAuditLogsResult_logs_AuditLog`, `ClassMeetingConfigsWithStatusQuery_classMeetingConfigs_ClassMeetingConfig`, `GenerateMeetingUrlMutation_generateMeetingUrl_GenerateMeetingUrlResult`, `SearchSuggestionsQuery_searchSuggestions_SuggestionSearchResult`, `UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow`

**Enum consumers (TS7053)** — 2 files have enum→enum mapping that must be fixed:
`frontend/common/views/dashboard/classes/audit/RegisteredStudentsSection.tsx` (GroupClassAttendanceStatus → AttendanceStatus mapping)
`frontend/common/views/dashboard/classes/audit/components/__shared__/communicationLogEntryItemShared.tsx` (CommunicationType → icon mapping)

---

## Naming Convention: Compact Mode

**Default mode** (`extractAllFieldsToTypes: true`) interleaves GraphQL type names:
```
{OperationName}_{field}_{GraphQLType}_{subField}_{GraphQLSubType}...
```
Example: `AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint`

**Compact mode** (`extractAllFieldsToTypesCompact: true`) omits GraphQL type names:
```
{OperationName}_{field}_{subField}...
```
Example: `AdminComplaintQueueQuery_adminComplaintQueue_rows`

| Metric | Default | Compact |
|--------|---------|---------|
| Lines | 6,940 | 6,025 |
| Types | 1,529 | 1,224 |
| Enums | 74 | 74 |

Conflict resolution is automatic — codegen appends a type suffix if two field paths collide with the same name but different types.

---

## What We Lose (acceptable)
- `gql` function from `gql.ts` — **0 consumers**
- `FragmentType` from `fragment-masking.ts` — **0 consumers**
- `index.ts` re-export — replaced with direct `graphql.ts` imports
- `ResultOf` utility — **0 consumers**

---

## Execution Plan

### Phase 0a: AGENTS.md & Instruction Files (DONE)

All 11 AGENTS.md/instruction files updated with new conventions. See plan v2 Phase 0a table for the full list.

### Phase 0b: Codegen Config Update + Regeneration

**Step 1**: Update `codegen.ts` — replace `preset: "client"` with direct plugins:

```ts
generates: {
  "./frontend/common/graphql/generated/gql/graphql.ts": {
    plugins: ["typescript-operations", "typed-document-node"],
    config: {
      ...sharedGqlConfig,
      extractAllFieldsToTypes: false,
      extractAllFieldsToTypesCompact: true,
    },
  },
},
```

Remove commented-out `graphql-types.ts` and `operations.ts` blocks.

**Step 2**: Clean up generated files:
- Delete `gql/gql.ts` (0 consumers)
- Delete `gql/fragment-masking.ts` (0 consumers)
- Update `gql/index.ts` to `export * from "./graphql"`

**Step 3**: Run `bun run codegen` to regenerate `graphql.ts`.

**Step 4**: Verify the new `graphql.ts`:
- [ ] Native TS enums present (74 enums)
- [ ] Extracted field types present (e.g., `MeQuery_me`, `QuotaQuery_quota`)
- [ ] Document nodes present (`TypedDocumentNode<...>`)
- [ ] No schema-level object types
- [ ] 7 temp enums present (AttendanceStatus, AvailabilityStatus, ProfileMode, UserRole, FileSortField, FileType, OnDemandStatus)
- [ ] ~6,025 lines, ~1,224 types

**Step 5**: Run `bun tsgo 2>&1 | grep "error TS" | wc -l` to capture the **real error count** after regeneration. This is the baseline for Phase 2 subagent dispatch.

**Step 6**: Save error list to file:
```bash
bun tsgo 2>&1 | grep "error TS" > /tmp/gql-errors-after-codegen.txt
```

### Phase 1: Safe Sed-Based Import Rewrites

**Script**: Python script applied to all `.ts`/`.tsx` files in `frontend/`, `test/`, `shared/`.

#### 1a. Import Path Rewrite (21 files)
```
gql/graphql-types  →  gql/graphql
gql/operations     →  gql/graphql
```

#### 1b. Operations.→named import conversion (37 files)
```
import type * as Operations from "@/frontend/common/graphql/generated/gql/graphql"
→
import type { XxxQuery, XxxQueryVariables, ... } from "@/frontend/common/graphql/generated/gql/graphql"
```
Then remove `Operations.` prefix from all references.

**This is NOT fully automatable via sed** — each file uses a different set of `Operations.` types. The script must:
1. Parse each file for `Operations.Xxx` references
2. Collect the set of unique names
3. Generate the named import statement
4. Remove the `Operations.` prefix from all usages

#### 1c. Args→Variables Replacement (for any remaining old-style references)
```
Types.Query*Args   →  *QueryVariables
Types.Mutation*Args →  *MutationVariables
```

#### 1d. Remove `as Types` / `as Operations` namespace imports that are now empty
After 1a-1c, some `import * as Types from "gql/graphql"` lines may have no remaining `Types.` references. Remove unused imports.

**After Phase 1**: Run tsgo again to get the reduced error count. Only complex type-name fixes remain for subagents.

```bash
bun tsgo 2>&1 | grep "error TS" > /tmp/gql-errors-after-sed.txt
```

### Phase 2: Subagent Pool — Type Name Fixes

**Error count**: TBD after Phase 1 (expecting ~150-180 errors across ~100-120 files down from 223/143).

#### 1. Enum Consumers (2-3 files — manual fix BEFORE subagents)

These files have enum-to-enum mapping that violates the NO MAPPING rule and requires updating GraphQL documents to emit the needed enum types:

- `frontend/common/views/dashboard/classes/audit/RegisteredStudentsSection.tsx` — uses `Record<GroupClassAttendanceStatus, AttendanceStatus>` mapping. Fix: update the query document to return `AttendanceStatus` directly, or use `GroupClassAttendanceStatus` throughout (no mapping).
- `frontend/common/views/dashboard/classes/audit/components/__shared__/communicationLogEntryItemShared.tsx` — uses `Record<CommunicationType, Icon>` mapping. This is a UI-level icon map, not a type mapping — acceptable as a UI constant, but the `CommunicationType` enum must be imported from `graphql.ts`.

Create temp docs if needed to force enum generation (already done: `_temp_enums.documents.ts`).

#### 2. Subagent Template Prompt

Save to: `.ai/plans/codegent/subagent-template.md`

```markdown
# GraphQL Codegen Consolidation — Type Fix Task

## Target File
{{TARGET_FILE}}

## Context
The GraphQL codegen has been consolidated from 3 files (graphql-types.ts, operations.ts, graphql.ts)
into a single `graphql.ts` file with native TS enums and compact extracted field types.

Your job: fix all TypeScript errors in the target file caused by this consolidation.

## Instructions

1. Read the target file: `{{TARGET_FILE}}`
2. Get exact errors:
   ```
   bun tsgo 2>&1 | grep "{{TARGET_FILE}}"
   ```
3. For each error, identify the fix:

   ### TS2305 / TS2724: No exported member
   - The file imports a schema type name (e.g., `User`, `Quota`) or a default-mode extracted
     type name (e.g., `AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint`)
     that no longer exists.
   - Find the correct compact extracted type name in `graphql.ts`:
     ```
     grep "^export type" frontend/common/graphql/generated/gql/graphql.ts | grep "<OperationName>_<field>"
     ```
   - Replace the old type name with the new compact extracted type name.

   ### TS2307: Cannot find module
   - The file imports from `gql/graphql-types` or `gql/operations` which are deleted.
   - Replace import path with `@/frontend/common/graphql/generated/gql/graphql`.

   ### TS7006: Implicit any
   - Cascade from a broken type. Fix the root type reference first, then the implicit any
     resolves automatically.

   ### TS2353: Extra __typename in fixtures/stories
   - The new extracted types don't include `__typename` unless the query explicitly selects it.
   - Remove `__typename` from test fixtures and story arguments.

   ### TS2322 / TS2345: Type mismatch
   - Cascade from using the wrong type. Fix the import to use the correct extracted type.

   ### TS2694: Namespace member not exported
   - The file references a type via `Types.Xxx` or `Operations.Xxx` that doesn't exist.
   - Replace with the correct named import from `graphql.ts`.

4. After fixing, verify:
   ```
   bun tsgo 2>&1 | grep "{{TARGET_FILE}}"
   ```
   Expect: 0 errors for this file.

5. If you cannot find the correct type name, REPORT it — do NOT create a workaround.

## CRITICAL RULES (Violations are BLOCKING)

1. **NO MAPPING**: Never create mapping functions or intermediate conversion layers.
   Use codegen types directly.
2. **NO INDEXED-ACCESS**: Never use `NonNullable<X["y"]>` workarounds.
   Use the named extracted type (e.g., `MeQuery_me`).
3. **NO SCHEMA TYPES**: Never import or reference schema-level object types.
   Only operation-derived types from `graphql.ts`.
4. **NO HARDCODED TYPES**: Never redefine types locally.
   If a type is missing from `graphql.ts`, the query document needs to select those fields.
5. **SINGLE SOURCE**: All imports from
   `@/frontend/common/graphql/generated/gql/graphql` only.

## Reference: Compact Type Naming
Types follow: `{OperationName}_{field}_{subField}...`
- `MeQuery_me` (not `MeQuery_me_User`)
- `QuotaQuery_quota` (not `QuotaQuery_quota_Quota`)
- `AdminComplaintQueueQuery_adminComplaintQueue_rows` (not
  `AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint`)

Collision resolution is automatic: codegen appends a type suffix if two field paths
collide with the same name but different types.
```

#### 3. Pool Orchestration

**Pool size**: 16 concurrent `task` type subagents
**Dispatch model**: Continuously-filled pool
- Build a queue of all files with tsgo errors (from `/tmp/gql-errors-after-sed.txt`)
- Sort by error count descending (most errors first)
- Dispatch first 16 files
- When a subagent completes, immediately dispatch the next file from the queue
- Repeat until queue is empty

**Each subagent receives**:
1. The template prompt from `.ai/plans/codegent/subagent-template.md`
2. The absolute path of the target file
3. Instructions to run `bun tsgo 2>&1 | grep "<file>"` for errors
4. Instructions to fix and verify (0 errors for that file)
5. Instructions to run `bun run scripts/health/sub-loop.ts <file> --lifecycle tsgo`

**Subagent type**: `task` (fast, CLI-focused, verbose output on failure)

#### 4. Post-Subagent Verification

After all subagents complete:
```bash
bun tsgo 2>&1 | grep "error TS" | wc -l    # Expect: 0
```

If errors remain:
1. Collect remaining errors
2. Identify any CROSS-FILE DEPENDENCIES (subagents that couldn't fix because another file needed changes)
3. Manually fix cross-file dependencies
4. Re-run tsgo

### Phase 3: Cleanup & Verification

1. `bun tsgo` — expect 0 errors
2. `bun run codegen` — verify no regression (graphql.ts unchanged on re-run)
3. Delete if still present:
   - `gql/gql.ts` (0 consumers)
   - `gql/fragment-masking.ts` (0 consumers)
4. Update `gql/index.ts` to `export * from "./graphql"` only
5. Clean up `_temp_enums.documents.ts` if all 7 enums are now referenced by real operations
6. `bun oxlint` — check for lint errors
7. `bun biome:check` — check formatting

### Phase 4: Quality Gate

```bash
bun quality-gate
```

If DUPLICATES fails: fix by extracting shared scaffolds (see `docs/frontend/duplication-elimination-patterns.md`).
If CODESCENE fails: `bun run codescene --file <path>`.
Re-run `bun quality-gate` to resume from last failed stage.

---

## Risk Assessment

- **~100-140 files** need manual fixes (subagent pool handles this)
- **No schema types generated** — by design, docs say "Object types should never be used"
- **Extracted type names are compact** (e.g., `GroupClassAuditQuery_groupClassAudit_adminNote`) — field path only
- **Conflict resolution is automatic** — codegen appends a type suffix on collision
- **Some old types may not have an extracted equivalent** if no query selects those fields — those consumers need a new query document that selects the needed fields. **Never** create local type definitions or mapping functions as a workaround.
- **`_temp_enums.documents.ts`** still needed to force 7 enums to be generated — should remain until schema operations reference them
- **Post-Phase 0b error re-capture is critical** — the error list changes because compact mode produces different type names than both the old schema types and the default-mode extracted types
- **Cross-file dependencies** — if a subagent can't fix a file because another file needs changes, it should REPORT it (not modify the other file). The orchestrator handles cross-file fixes in a follow-up wave.

## Files Modified Summary

| Phase | Files | Method |
|-------|-------|--------|
| 0a | 11 AGENTS.md/instruction files | Manual (DONE) |
| 0b | `codegen.ts`, `gql/index.ts` | Manual |
| 0b | Delete `gql/gql.ts`, `gql/fragment-masking.ts` | Manual |
| 0b | Regenerate `gql/graphql.ts` | `bun run codegen` |
| 1 | ~40 files (import paths, Operations. prefix) | Python script (sed-like) |
| 1 | 21 files (TS2307 module-not-found) | Python script (sed) |
| 2 | ~100-120 files (type name fixes) | 16-subagent pool |
| 2 | 2-3 files (enum consumers) | Manual (before subagents) |
| 3 | `gql/index.ts`, `_temp_enums.documents.ts` | Manual |
| 4 | Various | `bun quality-gate` |
