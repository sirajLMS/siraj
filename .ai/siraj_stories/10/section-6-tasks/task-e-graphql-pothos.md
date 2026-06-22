### Task E — Backend GraphQL Pothos: `statusTrackingSchedule` Query and `ScheduleQueryService`

**Objective:** Add the `statusTrackingSchedule` GraphQL query to the backend schema by:
1. Creating a thin `ScheduleQueryService` to gate access with permission checks
2. Defining a `StatusTrackingScheduleRow` Pothos object type
3. Adding the `statusTrackingSchedule` query field to the GraphQL schema
4. Running schema generation and codegen to update generated types

**Dependencies:** Depends on Task D — `SchedulingRepository.getStatusTrackingRows()` must be implemented and exported. `PermissionsService.hasAnyPermission()` must be available (from existing auth service).

**Layer-Specific Rules (Backend GraphQL — Flattened from backend/graphql/pothos/AGENTS.md):**
- **🚫 GraphQL Resolvers MUST NOT import from DB/Repo** — The `statusTrackingSchedule` query field resolver MUST delegate to `ScheduleQueryService.getStatusTrackingSchedule()`. No direct repository imports in Pothos files.
- **Pothos object types** expose `id` field for Apollo cache normalization.
- **Nullability** — fields are non-nullable by default unless explicitly set to `nullable: true`.
- **Locale propagation** — resolvers propagate `ctx.locale` to service calls.
- **Framework** — Pothos code-first GraphQL schema builder. Follow existing patterns in `schedule.pothos.ts`.

**Target Files:**
- `backend/services/schedule/schedule-query.service.ts` (Create NEW)
- `backend/graphql/pothos/schedule.pothos.ts` (Modify — add new Pothos type and query field)

Note: `backend/graphql/pothos/index.ts` already exports `schedule.pothos.ts` — no change needed to the index file.

---

**Detailed Implementation Steps:**

### Step 1: Create `schedule-query.service.ts`

Create `backend/services/schedule/schedule-query.service.ts`:

```typescript
import { SchedulingRepository, type StatusTrackingRow } from "@/backend/db/repo/scheduling.repository";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getBackendTranslations } from "@/backend/lib/intl";
import { AppPermission } from "@/shared/lib/enum";

/**
 * ScheduleQueryService — thin service layer for schedule-related read queries.
 *
 * This service gates access to scheduling data behind permission checks.
 * Currently supports the Status Tracking dashboard (admin view).
 *
 * Permission requirements:
 * - getStatusTrackingSchedule: requires SCHEDULE_VIEW_ALL OR DASHBOARD_VIEW_METRICS
 *   (either permission grants access — Academy Admin and Super Admin hold these)
 *
 * Architecture note:
 * - This service does NOT import from Drizzle or DB schema directly.
 * - All data access goes through SchedulingRepository.
 * - Called exclusively by Pothos resolvers in schedule.pothos.ts.
 */
export namespace ScheduleQueryService {
  /**
   * Fetches class instances for the status tracking dashboard.
   *
   * Returns all class instances scheduled on the given date, enriched with
   * student status and isFrozen flag. Results are ordered by scheduledStartAt.
   *
   * @param actorUserId - The ID of the requesting user (must hold SCHEDULE_VIEW_ALL or DASHBOARD_VIEW_METRICS)
   * @param date - The date to fetch classes for (day boundaries computed from viewerTimezone)
   * @param options - Optional search filter and timezone
   * @param locale - Optional locale for i18n error messages
   * @returns Array of StatusTrackingRow objects
   */
  export async function getStatusTrackingSchedule(
    actorUserId: string,
    date: Date,
    options?: { search?: string; viewerTimezone?: string },
    locale?: string
  ): Promise<StatusTrackingRow[]> {
    const hasPermission = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.SCHEDULE_VIEW_ALL,
      AppPermission.DASHBOARD_VIEW_METRICS,
    ]);

    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return SchedulingRepository.getStatusTrackingRows(date, options);
  }
}
```

**Key design decisions for `ScheduleQueryService`:**
- Uses `hasAnyPermission()` (not `hasPermission()`) — either `SCHEDULE_VIEW_ALL` OR `DASHBOARD_VIEW_METRICS` grants access (OR logic, not AND)
- `AppPermission.SCHEDULE_VIEW_ALL` and `AppPermission.DASHBOARD_VIEW_METRICS` must already exist in the enum from prior stories — verify before use
- If either permission enum value does not exist, it must be added to `shared/lib/enum.ts` first (coordination with earlier stories)
- The service is in `backend/services/schedule/` — a new sub-directory of `backend/services/`
- Exports `StatusTrackingRow` type by re-exporting it from the repository (via named import) — callers can import the type from the service if needed

**Verify these enum values exist before using them:**
```bash
grep -n "SCHEDULE_VIEW_ALL\|DASHBOARD_VIEW_METRICS" shared/lib/enum.ts
```
If missing, add them to `shared/lib/enum.ts` following the existing naming convention.

### Step 2: Add `StatusTrackingScheduleRow` Pothos Type to `schedule.pothos.ts`

Open `backend/graphql/pothos/schedule.pothos.ts`. The file already has:
- `DailyScheduleMetrics` object type (uses `isFrozen` via the `suspended` count field at line 10)
- `DailyScheduleList` type
- `RescheduleTrackingRow` object type
- `RescheduleTrackingMetrics` object type
- `RescheduleTrackingInput` input type

Add the following at the END of the file (after all existing types and queries):

```typescript
// ─── Status Tracking Schedule Row ─────────────────────────────────────────────

/**
 * GraphQL object type representing a single class instance row in the
 * Status Tracking admin dashboard. Returned by the statusTrackingSchedule query.
 *
 * Fields include student status and isFrozen flag to support the
 * frontend's mapToSessionStatus() logic in StatusTrackingContainer.
 */
export type StatusTrackingScheduleRowDefinition = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentStatus: string;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date | string;
  scheduledEndAt: Date | string;
  durationMinutes: number;
  executionState: string;
  outcome: string;
  isFrozen: boolean;
};

const StatusTrackingScheduleRowRef =
  gqlSchemaBuilder.objectRef<StatusTrackingScheduleRowDefinition>(
    "StatusTrackingScheduleRow"
  );

export const StatusTrackingScheduleRowPothosObject =
  StatusTrackingScheduleRowRef.implement({
    fields: t => ({
      id: t.exposeString("id"),
      studentId: t.exposeString("studentId"),
      studentName: t.exposeString("studentName"),
      studentInitials: t.exposeString("studentInitials"),
      studentStatus: t.exposeString("studentStatus"),
      teacherId: t.exposeString("teacherId"),
      teacherName: t.exposeString("teacherName"),
      scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
      scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
      durationMinutes: t.exposeInt("durationMinutes"),
      executionState: t.exposeString("executionState"),
      outcome: t.exposeString("outcome"),
      isFrozen: t.exposeBoolean("isFrozen"),
    }),
  });
```

**Notes on the type definition:**
- `id` is exposed as a string — required for Apollo cache normalization
- `scheduledStartAt` and `scheduledEndAt` use `t.expose(..., { type: "DateTime" })` — the `DateTime` scalar type is already registered in the Pothos schema (verified from existing `RescheduleTrackingRow` which uses the same pattern)
- `studentStatus` and `executionState` are exposed as strings — they map to DB enum values but GraphQL doesn't need a custom enum scalar for these display fields
- `durationMinutes` uses `t.exposeInt()` — must match the TypeScript type `number` from `StatusTrackingRow`

### Step 3: Add the `statusTrackingSchedule` Query Field

Add the query field at the END of `schedule.pothos.ts`, AFTER the object type definition from Step 2:

```typescript
// ─── Status Tracking Schedule Query ───────────────────────────────────────────

import { ScheduleQueryService } from "@/backend/services/schedule/schedule-query.service";

gqlSchemaBuilder.queryField("statusTrackingSchedule", t =>
  t.field({
    type: [StatusTrackingScheduleRowRef],
    args: {
      date: t.arg.string({ required: true }),
      search: t.arg.string({ required: false }),
      viewerTimezone: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const date = new Date(args.date);
      return ScheduleQueryService.getStatusTrackingSchedule(
        ctx.user?.id ?? "",
        date,
        {
          search: args.search ?? undefined,
          viewerTimezone: args.viewerTimezone ?? undefined,
        },
        ctx.locale
      );
    },
  })
);
```

**Notes on the query field:**
- `type: [StatusTrackingScheduleRowRef]` — returns an array of `StatusTrackingScheduleRow` objects
- `date` argument is a `String!` (required) — passed as ISO date string from frontend, parsed to `Date` in resolver
- `search` and `viewerTimezone` are optional strings (`String` — no `!`)
- `ctx.user?.id ?? ""` — uses optional chaining; empty string triggers unauthorized error in `ScheduleQueryService`
- `ctx.locale` — propagated from request context for i18n error messages
- The import of `ScheduleQueryService` MUST be at the top of the file (or at least before the query field that uses it) — move it to the top import section of `schedule.pothos.ts` rather than inline

**Important:** Move the `import { ScheduleQueryService } from "..."` to the top-level imports of `schedule.pothos.ts`, not inline in the code block above. The inline placement above is for documentation clarity only.

### Step 4: Verify Import Structure in `schedule.pothos.ts`

The complete import section at the top of `schedule.pothos.ts` should include (after this task):

```typescript
// Existing imports (from before Story 10)
import { gqlSchemaBuilder } from "@/backend/graphql/pothos/builder";
// ... other existing imports ...
import { ScheduleService } from "@/backend/services/schedule/schedule.service"; // if exists

// New import for Story 10
import { ScheduleQueryService } from "@/backend/services/schedule/schedule-query.service";
```

Verify no DB or repository imports are in the file:
```bash
rg "from ['\"]backend/db" backend/graphql/pothos/schedule.pothos.ts
```
Expected: Empty (no matches).

### Step 5: Run Schema Generation and Codegen

```bash
# Regenerate GraphQL schema from Pothos definitions
bun run generate:gqlSchema

# Generate TypeScript types from the updated schema and documents
bun codegen
```

**Expected output:**
- `bun run generate:gqlSchema` — succeeds, regenerates `backend/graphql/generated/schema.graphql` (or similar) with new `statusTrackingSchedule` query and `StatusTrackingScheduleRow` type visible
- `bun codegen` — succeeds, generates `StatusTrackingScheduleQuery` operation type and `QueryStatusTrackingScheduleArgs` in `frontend/graphql/generated/gql/graphql-types.ts`

**Verify the generated types:**
```bash
grep -n "StatusTrackingSchedule\|statusTrackingSchedule" frontend/graphql/generated/gql/graphql-types.ts
```

Expected: Multiple lines showing the generated operation type, return type fields, and args type.

---

**Test Execution Requirements:**

```bash
# Verify no repo imports in Pothos files
rg "from ['\"]backend/db" backend/graphql/pothos/

# Verify no DB imports in schedule-query.service.ts
rg "from ['\"]drizzle-orm|from ['\"]backend/db/schema" backend/services/schedule/

# Run schema generation
bun run generate:gqlSchema

# Run codegen
bun codegen

# TypeScript compilation
bun tsgo

# Linting
bun biome:check
bun lint
```

---

**Success Criteria / Check Progress Points:**

- [ ] `ScheduleQueryService` is in `backend/services/schedule/schedule-query.service.ts`
- [ ] `ScheduleQueryService.getStatusTrackingSchedule()` checks `SCHEDULE_VIEW_ALL` OR `DASHBOARD_VIEW_METRICS`
- [ ] `ScheduleQueryService` does NOT import from Drizzle/DB schema
- [ ] `StatusTrackingScheduleRowDefinition` type defined in `schedule.pothos.ts`
- [ ] `StatusTrackingScheduleRowRef` object ref created with Pothos builder
- [ ] All 13 fields exposed on `StatusTrackingScheduleRowPothosObject` (including `id` for cache normalization)
- [ ] `scheduledStartAt` and `scheduledEndAt` use `DateTime` scalar type
- [ ] `statusTrackingSchedule` query field registered with `gqlSchemaBuilder.queryField()`
- [ ] Query field resolves via `ScheduleQueryService.getStatusTrackingSchedule()`
- [ ] `ctx.locale` propagated to service call
- [ ] No DB/repo imports in `schedule.pothos.ts`
- [ ] `ScheduleQueryService` imported at top of `schedule.pothos.ts`
- [ ] `bun run generate:gqlSchema` succeeds with 0 errors
- [ ] `bun codegen` succeeds with 0 errors
- [ ] Generated types include `StatusTrackingScheduleQuery` and `QueryStatusTrackingScheduleArgs`
- [ ] `bun tsgo` passes with 0 TypeScript errors

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
