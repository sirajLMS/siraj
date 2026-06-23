### Task H — Backend GraphQL: Pothos Objects, Queries & Mutations

**Objective:** Define Pothos GraphQL types for `AttendanceReportRow`, a new enum for `ReportGroupingMode`, and an input type for the filters. Expose `deleteLearningResource` as a mutation and `generateAttendanceReport` as a query.

**Dependencies:** Depends on Task D and Task G — relies on `LearningResourceService.deleteResource` and `ReportService.generateAttendanceReport`.

**Layer-Specific Rules (Backend GraphQL — Flattened from backend/graphql/pothos/AGENTS.md):**
- **🚫 NO DB/Repo Imports**: Resolvers can ONLY depend on `backend/services/`.
- Nullability: Fields are non-nullable by default.
- Locale Propagation: Resolvers must propagate `ctx.locale` to service calls if needed.
- Cache Updates: Expose an `id` field on GraphQL objects. For ephemeral report rows, generate a deterministic `id` (e.g., base64 combination of parameters or just use `groupKey` if it's unique per query).

**Target Files:**
- `backend/graphql/pothos/resource.pothos.ts` (Modify)
- `backend/graphql/pothos/report.pothos.ts` (New)
- `backend/graphql/pothos/index.ts` (Modify)

**Detailed Implementation Steps:**

*Step 1: Modify `resource.pothos.ts` for the mutation*

```typescript
// backend/graphql/pothos/resource.pothos.ts
import { builder } from "../builder";
import { LearningResourceService } from "../../services/resource/learning-resource.service";

// ... existing code ...

builder.mutationField("deleteLearningResource", (t) =>
  t.boolean({
    description: "Permanently deletes a learning resource from storage and database.",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // Must pass ctx.userId to the service layer for permission check
      if (!ctx.userId) throw new Error("unauthenticated");
      return LearningResourceService.deleteResource(String(args.id), ctx.userId);
    },
  })
);
```

*Step 2: Create `report.pothos.ts`*

```typescript
// backend/graphql/pothos/report.pothos.ts
import { builder } from "../builder";
import { ReportService } from "../../services/report/report.service";
import { ReportGroupingMode } from "../../db/repo/report.repository";

export const ReportGroupingModeEnum = builder.enumType(ReportGroupingMode, {
  name: "ReportGroupingMode",
});

export const AttendanceReportFiltersInput = builder.inputType("AttendanceReportFiltersInput", {
  fields: (t) => ({
    fromDate: t.string({ required: true }), // ISO Date String
    toDate: t.string({ required: true }),   // ISO Date String
    teacherId: t.string({ required: false }),
    groupBy: t.field({ type: ReportGroupingModeEnum, required: true }),
  }),
});

export const AttendanceReportRowObj = builder.objectRef<any>("AttendanceReportRow").implement({
  description: "A single row of the aggregated attendance report.",
  fields: (t) => ({
    // For Apollo cache, we need a unique ID. groupKey is unique per query result.
    id: t.exposeString("groupKey"),
    groupKey: t.exposeString("groupKey"),
    groupLabel: t.exposeString("groupLabel"),
    takenClasses: t.exposeInt("takenClasses"),
    absentClasses: t.exposeInt("absentClasses"),
    leaveClasses: t.exposeInt("leaveClasses"),
    pendingClasses: t.exposeInt("pendingClasses"),
    totalHours: t.exposeFloat("totalHours", { nullable: true }), // Nullable as it could be masked
    paidEGP: t.exposeFloat("paidEGP", { nullable: true }),
    paidUSD: t.exposeFloat("paidUSD", { nullable: true }),
  }),
});

builder.queryField("generateAttendanceReport", (t) =>
  t.field({
    type: [AttendanceReportRowObj],
    args: {
      filters: t.arg({ type: AttendanceReportFiltersInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.userId) throw new Error("unauthenticated");
      
      const filters = {
        fromDate: new Date(args.filters.fromDate),
        toDate: new Date(args.filters.toDate),
        teacherId: args.filters.teacherId ?? undefined,
        groupBy: args.filters.groupBy,
      };

      return ReportService.generateAttendanceReport(filters, ctx.userId);
    },
  })
);
```

*Step 3: Export from `index.ts`*

Open `backend/graphql/pothos/index.ts` and add:
```typescript
import "./report.pothos";
```

*Step 4: Run schema generation and codegen*

**Test Execution Requirements:**
- Run GraphQL schema generation and codegen:
  ```bash
  bun run generate:gqlSchema
  bun codegen
  ```

**Success Criteria / Check Progress Points:**
- [ ] `deleteLearningResource` mutation is wired up securely.
- [ ] `generateAttendanceReport` query is wired up and maps string dates to `Date` objects.
- [ ] `id` field is exposed on `AttendanceReportRowObj` for Apollo cache.
- [ ] `bun run generate:gqlSchema` and `bun codegen` succeed without errors.
- [ ] No DB/repo imports exist in GraphQL files (other than the Enum type reference if acceptable, or redefine enum).

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
