### Task B3 — Complaint Repository File Listing Extension

**Objective:**
Add a single new method `getComplaintFiles` to the existing `ComplaintRepository` namespace in `backend/db/repo/complaint.repository.ts`. This method retrieves all files attached to a specific complaint by joining the `complaintFiles` junction table with the `storageFiles` table, returning file metadata (path, size, MIME type) alongside the junction table's `usageType` and `createdAt`. This method supports the admin complaint detail view, where attached files are displayed as a downloadable list, and the parent complaint history view, where parents can see files they previously uploaded.

**Dependencies:**
- Depends on Task A (Migration/Schema) — the `complaintFiles` junction table and `storageFiles` table must exist. Both tables were created in Story 14 and verified in the Sprint 15 prerequisites (`backend/db/schema/storage.ts:112-129` for `complaintFiles`, `backend/db/schema/storage.ts:11-15` for `storageFiles`).
- Depends on Story 14 execution — the base `ComplaintRepository` namespace with `submitComplaint`, `getComplaintsByParent`, `getAdminComplaintQueue`, `getComplaintById`, `getComplaintMetrics`, and `getUnansweredComplaints` must already exist in `backend/db/repo/complaint.repository.ts`.

**Layer-Specific Rules (Database Repositories — Flattened from backend/db/repo/AGENTS.md):**
- **Drizzle ORM**: This layer exclusively uses Drizzle ORM for PostgreSQL.
- **Query Guidelines**: Use standard `.select().from().innerJoin()` instead of relational `findMany` to avoid `SQL<unknown>` errors and type resolution issues.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and file cleanup orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Use `getBackendTranslations` with optional `locale?: string` parameter for localized error messages.
- **Conditional Aggregation**: Use `sql<number>` template literals with `.mapWith(Number)` for count queries (not applicable to this task — no aggregation needed).
- **Transactions**: Read-only methods use `tx ?? db`.

**Target Files:**
| File | Action |
|------|--------|
| `backend/db/repo/complaint.repository.ts` | MODIFY — add 1 new method, add 1 new type, add 2 new imports |

---

### Detailed Implementation Steps

#### Step 1 — Update Imports in `complaint.repository.ts`

Open `backend/db/repo/complaint.repository.ts`. Add the missing schema table imports needed by the new method:

```typescript
import { and, count, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaintFiles, complaints, parents, storageFiles, students, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { ComplaintStatus } from "@/shared/lib/enum";
```

The existing file from Story 14 already imports `complaints`, `parents`, `students`, `users` from `@/backend/db/schema`. Add `complaintFiles` and `storageFiles` to the same import statement. Verify all Drizzle operators (`and`, `count`, `desc`, `eq`, `ilike`, `isNull`, `sql`) are already imported — they should be from Story 14.

---

#### Step 2 — Add `ComplaintFileRow` Type and `getComplaintFiles` Method

Add inside the `ComplaintRepository` namespace, after the existing `getUnansweredComplaints` method:

```typescript
  export type ComplaintFileRow = {
    fileId: string;
    filePath: string;
    isProtected: boolean;
    usageType: string;
    createdAt: Date;
  };

  export const getComplaintFiles = async (
    complaintId: string,
    tx?: DBTransaction
  ): Promise<ComplaintFileRow[]> => {
    const queryDb = tx ?? db;

    return queryDb
      .select({
        fileId: storageFiles.id,
        filePath: storageFiles.path,
        isProtected: storageFiles.isProtected,
        usageType: complaintFiles.usageType,
        createdAt: complaintFiles.createdAt,
      })
      .from(complaintFiles)
      .innerJoin(storageFiles, eq(complaintFiles.fileId, storageFiles.id))
      .where(eq(complaintFiles.complaintId, complaintId))
      .orderBy(desc(complaintFiles.createdAt));
  };
```

**Key implementation notes for `getComplaintFiles`:**

- **Join strategy**: Uses `innerJoin` between `complaintFiles` and `storageFiles` on `complaintFiles.fileId = storageFiles.id`. An `innerJoin` is appropriate here because a `complaintFiles` row without a matching `storageFiles` row represents an orphaned junction record (the file was deleted via FK cascade) and should not be returned.
- **Column selection**: Selects `storageFiles.id` (as `fileId`), `storageFiles.path` (as `filePath`), and `storageFiles.isProtected` from the storage table, plus `complaintFiles.usageType` and `complaintFiles.createdAt` from the junction table.
- **`storageFiles` schema reference**: The `storageFiles` table (`backend/db/schema/storage.ts:11-15`) has only three columns: `id` (uuid PK), `path` (text, unique, not null), and `isProtected` (boolean, default false). There is no `fileName`, `fileSize`, or `mimeType` column on this table — file metadata is managed at the application/storage service level, not in the database. The `ComplaintFileRow` type reflects the actual schema columns.
- **No soft-delete filter**: The `complaintFiles` junction table does not have a `deletedAt` column. The `storageFiles` table also does not have soft-delete. If a file is removed, the FK `onDelete: "cascade"` automatically deletes the `complaintFiles` row. No `isNull(deletedAt)` filter is needed.
- **Ordering**: Results are ordered by `complaintFiles.createdAt DESC` — newest uploads first.
- **Return type**: Returns an array of `ComplaintFileRow` objects. For a complaint with no attached files, returns an empty array `[]` (not `null`).
- **Transaction pattern**: Uses `tx ?? db` — this is a read-only query that does not require transaction wrapping.
- **No complaint existence check**: The method does NOT verify that the complaint exists or is not soft-deleted. The service layer (`ComplaintService`) is responsible for validating complaint existence and permissions before calling this method. If the `complaintId` does not exist, the `WHERE` clause simply matches zero rows and returns `[]`.

---

#### Step 3 — Verify Namespace Exports

After adding the method, verify the `ComplaintRepository` namespace contains the complete method list:

```typescript
export namespace ComplaintRepository {
  // Story 14 (kept):
  //   submitComplaint
  //   getComplaintsByParent
  //   getAdminComplaintQueue
  //   getComplaintById
  //   getComplaintMetrics
  //   getUnansweredComplaints

  // Story 15 (new):
  //   getComplaintFiles

  // Story 15 (new types):
  //   ComplaintFileRow

  // Story 14 (kept types):
  //   ComplaintSubmitInput
  //   AdminComplaintQueueRow
  //   AdminComplaintQueueResult
  //   ComplaintMetrics
}
```

The new method and type are declared with `export` inside the namespace. The `ComplaintRepository` is already exported from `backend/db/repo/index.ts` (added in Story 14) — no barrel export update needed.

---

#### Step 4 — TypeScript Compilation Check

After adding the method, run:

```bash
bun tsgo
```

Expected: 0 TypeScript errors. Pay attention to:
- `complaintFiles` and `storageFiles` imports — both must be exported from `backend/db/schema/index.ts` (they are, via `export * from "./storage"` and `export * from "./communications"`).
- `innerJoin` column reference — `complaintFiles.fileId` references `storageFiles.id` via the FK defined in the schema.
- `ComplaintFileRow` type shape — must match the select column projection exactly.

---

### Test Execution Requirements

Run the database test suite after completing the method implementation:

```bash
bun run test:db
```

**Expected output:** 0 failures. All existing tests still pass. New method tests will be added in Task B4 (Repository Tests).

Also verify TypeScript compilation and linting:

```bash
bun tsgo
bun biome:check
bun lint
```

---

### Success Criteria / Check Progress Points

- [ ] `ComplaintFileRow` type is exported with `fileId`, `filePath`, `isProtected`, `usageType`, `createdAt` fields
- [ ] `getComplaintFiles()` joins `complaintFiles` with `storageFiles` via `innerJoin` on `fileId`
- [ ] `getComplaintFiles()` selects `storageFiles.id`, `storageFiles.path`, `storageFiles.isProtected`, `complaintFiles.usageType`, `complaintFiles.createdAt`
- [ ] `getComplaintFiles()` filters by `complaintId` and orders by `complaintFiles.createdAt DESC`
- [ ] `getComplaintFiles()` returns an empty array `[]` for a complaint with no attached files
- [ ] `getComplaintFiles()` uses `tx ?? db` pattern for read-only access
- [ ] No soft-delete filter applied — `complaintFiles` and `storageFiles` tables do not have `deletedAt` columns
- [ ] `complaintFiles` and `storageFiles` are imported from `@/backend/db/schema`
- [ ] The method does NOT verify complaint existence — that is the service layer's responsibility
- [ ] All queries use `.select().from().innerJoin()` — no `findMany` or relational query API
- [ ] `bun run test:db` passes with zero failures
- [ ] `bun tsgo` reports zero type errors

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
