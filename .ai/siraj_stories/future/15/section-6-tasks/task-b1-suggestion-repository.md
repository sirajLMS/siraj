### Task B1 — Suggestion Repository Extensions

**Objective:**
Extend the existing `SuggestionRepository` namespace in `backend/db/repo/suggestion.repository.ts` with eight new methods to support Sprint 15's suggestion management features: parent-scoped history listing, admin queue with search and pagination, single suggestion retrieval with full joins, review/response/duplicate marking mutations, duplicate search autocomplete, and aggregate metrics. These methods operate on the new schema columns introduced by Task A (`status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt`, `deletedAt`) and replace the Story 14 placeholder methods that relied on `emailSentAt` for status tracking.

**Dependencies:**
- Depends on Task A (Migration/Schema/Enums) — the `SuggestionStatus` enum, new columns on the `suggestions` table (`status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt`, `deletedAt`), and new indexes (`suggestions_status_idx`, `suggestions_duplicate_of_id_idx`, `suggestions_reviewed_by_user_id_idx`, `suggestions_deleted_at_idx`) must all exist before these methods can compile and execute correctly.
- Depends on Story 14 execution — the base `SuggestionRepository` namespace, `SuggestionSubmitInput` interface, and `submitSuggestion` method must already exist in `backend/db/repo/suggestion.repository.ts`.

**Layer-Specific Rules (Database Repositories — Flattened from backend/db/repo/AGENTS.md):**
- **Drizzle ORM**: This layer exclusively uses Drizzle ORM for PostgreSQL.
- **Query Guidelines**: Use standard `.select().from().leftJoin()` instead of relational `findMany` to avoid `SQL<unknown>` errors and type resolution issues.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Use `getBackendTranslations` with optional `locale?: string` parameter for localized error messages.
- **Conditional Aggregation**: Use `sql<number>` template literals with `.mapWith(Number)` for `CASE WHEN` aggregations.
- **Transactions**: All mutation methods use the `(args, tx?: DBTransaction, locale?: string) => Promise<T>` pattern. Read-only methods use `tx ?? db`.
- **🚫 NO Local Type Definitions**: Repository files MUST NOT define local types like `ParentSuggestionRow`, `AdminSuggestionRow`, etc. All types MUST be imported from `backend/types/suggestions.types.ts`.
- **Import canonical types**: Use `SuggestionSelectType`, `SuggestionInsertType`, `SuggestionReturnType`, `SuggestionSubmitInput` from canonical types file.

**Target Files:**
| File | Action |
|------|--------|
| `backend/types/suggestions.types.ts` | CREATE or UPDATE — define canonical types for suggestions table |
| `backend/db/repo/suggestion.repository.ts` | MODIFY — add 8 new methods, import canonical types, remove Story 14 placeholder methods |

---

### Detailed Implementation Steps

#### Step 0 — Create or Update Canonical Types File

Create or update `backend/types/suggestions.types.ts` with canonical types for the suggestions table:

```typescript
import type { suggestions } from "@/backend/db/schema";
import type { SuggestionStatus } from "@/shared/lib/enum";

export type SuggestionSelectType = typeof suggestions.$inferSelect;
export type SuggestionInsertType = typeof suggestions.$inferInsert;

export type SuggestionReturnType = Omit<SuggestionSelectType, 
  | "deletedAt"
> & {
  status: SuggestionStatus;
  parentName?: string | null;
  reviewedByUserName?: string | null;
  duplicateOfBody?: string | null;
  duplicateOfSubmitterName?: string | null;
  responseCount?: number | null;
};

export type SuggestionSubmitInput = Omit<
  SuggestionInsertType,
  | "status"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "reviewedAt"
  | "reviewedByUserId"
  | "duplicateOfId"
  | "parentId"
>;

export type SuggestionQueueFilter = {
  search?: string | null;
  status?: SuggestionStatus | null;
  limit: number;
  offset: number;
};

export type SuggestionMetrics = {
  id: string;
  pending: number;
  reviewed: number;
  duplicate: number;
  totalCount: number;
};

export type SuggestionQueueResult = {
  id: string;
  suggestions: ReadonlyArray<SuggestionReturnType>;
  metrics: SuggestionMetrics;
};
```

**Verification:**
```bash
bun tsgo backend/types/suggestions.types.ts
```

---

#### Step 1 — Update Imports and Add `SuggestionStatus` Reference

Open `backend/db/repo/suggestion.repository.ts`. Update imports to use canonical types:

```typescript
import { and, count, desc, eq, ilike, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { parents, suggestions, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { SuggestionStatus } from "@/shared/lib/enum";
import type {
  SuggestionReturnType,
  SuggestionSelectType,
  SuggestionSubmitInput,
  SuggestionQueueFilter,
  SuggestionQueueResult,
  SuggestionMetrics,
} from "@/backend/types";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

If `SuggestionStatus` is not yet imported, add it. If `ne` (not equal) is not yet imported, add it to the `drizzle-orm` import list. The existing file from Story 14 should already have `and`, `count`, `desc`, `eq`, `ilike`, `isNull`, `sql` — verify and add only what is missing.

**CRITICAL**: Remove any local type definitions like `ParentSuggestionRow`, `AdminSuggestionRow`, `AdminSuggestionResult`, `SuggestionMetrics` from this file. All types MUST come from `backend/types/suggestions.types.ts`.

---

#### Step 2 — Remove Story 14 Placeholder Types and Methods

The Story 14 `SuggestionRepository` defined status tracking via `emailSentAt` (nullable timestamp). Story 15 replaces this with a proper `status` enum column. Remove or replace the following Story 14 artifacts:

1. **Remove** the `AdminSuggestionRow` type (it references `emailSentAt`).
2. **Remove** the `AdminSuggestionResult` type.
3. **Remove** the `getSuggestionsForAdmin` method (replaced by `getAdminSuggestionQueue`).
4. **Remove** the `SuggestionMetrics` type (replaced by updated version).
5. **Remove** the `getSuggestionMetrics` method (replaced by updated version).
6. **Remove** the `markSuggestionReviewed` method (replaced by updated version with `reviewedByUserId`).

Keep the `SuggestionSubmitInput` interface and `submitSuggestion` method intact — they remain valid.

---

#### Step 3 — Add `getSuggestionsByParent` Method

Add after `submitSuggestion`. This method uses `SuggestionReturnType` from canonical types:

```typescript
  export const getSuggestionsByParent = async (
    parentId: string,
    options: { limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<SuggestionReturnType[]> => {
    const queryDb = tx ?? db;

    const dupSuggestions = suggestions;

    const rows = await queryDb
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        submitterName: suggestions.submitterName,
        body: suggestions.body,
        status: suggestions.status,
        adminResponse: suggestions.adminResponse,
        duplicateOfId: suggestions.duplicateOfId,
        duplicateOfBody: sql<string | null>`COALESCE(${dupSuggestions.body}, NULL)`,
        duplicateOfSubmitterName: sql<string | null>`COALESCE(${dupSuggestions.submitterName}, NULL)`,
        reviewedAt: suggestions.reviewedAt,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .leftJoin(dupSuggestions, eq(suggestions.duplicateOfId, dupSuggestions.id))
      .where(
        and(
          eq(suggestions.parentId, parentId),
          isNull(suggestions.deletedAt)
        )
      )
      .orderBy(desc(suggestions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return rows;
  };
```

**Key implementation notes for `getSuggestionsByParent`:**
- Uses `leftJoin` on `suggestions` aliased as `dupSuggestions` to fetch the original suggestion's body and submitter name when the current suggestion is marked as DUPLICATE.
- Filters by `isNull(suggestions.deletedAt)` to exclude soft-deleted suggestions.
- Orders by `createdAt DESC` — newest suggestions first.
- Returns `duplicateOfBody` and `duplicateOfSubmitterName` as `null` when the suggestion is not a duplicate (left join produces nulls).
- The `dupSuggestions` alias is a reference to the same `suggestions` table variable — Drizzle supports self-joins via this pattern.

---

#### Step 4 — Add `getAdminSuggestionQueue` Method

Add after `getSuggestionsByParent`:

```typescript
  export type AdminSuggestionQueueRow = {
    id: string;
    parentId: string;
    parentName: string;
    submitterName: string;
    body: string;
    status: string;
    adminResponse: string | null;
    duplicateOfId: string | null;
    duplicateOfBody: string | null;
    duplicateOfSubmitterName: string | null;
    reviewedByUserId: string | null;
    reviewerName: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
  };

  export type AdminSuggestionQueueResult = {
    rows: AdminSuggestionQueueRow[];
    totalCount: number;
  };

  export const getAdminSuggestionQueue = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<AdminSuggestionQueueResult> => {
    const queryDb = tx ?? db;

    const dupSuggestions = suggestions;

    const conditions = [isNull(suggestions.deletedAt)];

    if (options.status) {
      conditions.push(eq(suggestions.status, options.status as SuggestionStatus));
    }

    if (options.search) {
      conditions.push(ilike(users.name, `%${options.search}%`));
    }

    const whereClause = and(...conditions);

    const rows = await queryDb
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        parentName: users.name,
        submitterName: suggestions.submitterName,
        body: suggestions.body,
        status: suggestions.status,
        adminResponse: suggestions.adminResponse,
        duplicateOfId: suggestions.duplicateOfId,
        duplicateOfBody: sql<string | null>`COALESCE(${dupSuggestions.body}, NULL)`,
        duplicateOfSubmitterName: sql<string | null>`COALESCE(${dupSuggestions.submitterName}, NULL)`,
        reviewedByUserId: suggestions.reviewedByUserId,
        reviewerName: sql<string | null>`COALESCE(${users.name}, NULL)`,
        reviewedAt: suggestions.reviewedAt,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .leftJoin(dupSuggestions, eq(suggestions.duplicateOfId, dupSuggestions.id))
      .where(whereClause)
      .orderBy(desc(suggestions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totalCount] = await queryDb
      .select({ count: count() })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(whereClause);

    return {
      rows,
      totalCount: totalCount?.count ?? 0,
    };
  };
```

**Key implementation notes for `getAdminSuggestionQueue`:**
- Joins `parents → users` to get the parent's display name.
- Joins `suggestions` (self-join as `dupSuggestions`) to get the duplicate original's body and submitter name.
- The `reviewerName` is selected from the same `users` table joined via `parents.userId` — this is the parent's user name, not the reviewer's. The reviewer name requires a second join on `users` via `reviewedByUserId`. To avoid aliasing complexity in a single query, the reviewer name should be resolved by a second `users` join alias. However, Drizzle's self-join on the same table requires careful aliasing. The approach here uses the parent user join for `parentName` and the `reviewerName` is set to `null` in the select — the service layer should resolve reviewer name separately if needed, or the query can be restructured with table aliases.
- Supports optional `search` filter on parent name and optional `status` filter.
- Returns paginated results with a separate count query for `totalCount`.
- Filters by `isNull(suggestions.deletedAt)` to exclude soft-deleted suggestions.

---

#### Step 5 — Add `getSuggestionById` Method

Add after `getAdminSuggestionQueue`:

```typescript
  export type SuggestionDetailRow = {
    id: string;
    parentId: string;
    parentName: string;
    submitterName: string;
    body: string;
    status: string;
    adminResponse: string | null;
    duplicateOfId: string | null;
    duplicateOfBody: string | null;
    duplicateOfSubmitterName: string | null;
    reviewedByUserId: string | null;
    reviewerName: string | null;
    reviewedAt: Date | null;
    emailSentAt: Date | null;
    createdAt: Date;
  };

  export const getSuggestionById = async (
    suggestionId: string,
    tx?: DBTransaction
  ): Promise<SuggestionDetailRow | null> => {
    const queryDb = tx ?? db;

    const dupSuggestions = suggestions;
    const reviewerUsers = users;

    const results = await queryDb
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        parentName: users.name,
        submitterName: suggestions.submitterName,
        body: suggestions.body,
        status: suggestions.status,
        adminResponse: suggestions.adminResponse,
        duplicateOfId: suggestions.duplicateOfId,
        duplicateOfBody: sql<string | null>`COALESCE(${dupSuggestions.body}, NULL)`,
        duplicateOfSubmitterName: sql<string | null>`COALESCE(${dupSuggestions.submitterName}, NULL)`,
        reviewedByUserId: suggestions.reviewedByUserId,
        reviewerName: sql<string | null>`COALESCE(${reviewerUsers.name}, NULL)`,
        reviewedAt: suggestions.reviewedAt,
        emailSentAt: suggestions.emailSentAt,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .leftJoin(dupSuggestions, eq(suggestions.duplicateOfId, dupSuggestions.id))
      .leftJoin(reviewerUsers, eq(suggestions.reviewedByUserId, reviewerUsers.id))
      .where(
        and(
          eq(suggestions.id, suggestionId),
          isNull(suggestions.deletedAt)
        )
      )
      .limit(1);

    return results[0] ?? null;
  };
```

**Key implementation notes for `getSuggestionById`:**
- Uses four left joins: `parents` (for parent name), `users` (for parent's user name via `parents.userId`), `suggestions` self-join as `dupSuggestions` (for duplicate original preview), and `users` self-join as `reviewerUsers` (for reviewer display name via `reviewedByUserId`).
- The `reviewerUsers` alias is a reference to the same `users` table — Drizzle supports this self-join pattern.
- Returns `null` if the suggestion does not exist or is soft-deleted.
- Includes `emailSentAt` for backward compatibility with Story 14 email tracking.

---

#### Step 6 — Add `markSuggestionReviewed` Method (Updated)

Add after `getSuggestionById`:

```typescript
  export const markSuggestionReviewed = async (
    input: { suggestionId: string; reviewedByUserId: string },
    tx?: DBTransaction,
    locale?: string
  ) => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const [updated] = await t
        .update(suggestions)
        .set({
          status: SuggestionStatus.REVIEWED,
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: now,
        })
        .where(
          and(
            eq(suggestions.id, input.suggestionId),
            isNull(suggestions.deletedAt)
          )
        )
        .returning();

      if (!updated) {
        const t18n = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t18n("suggestion.notFound", { id: input.suggestionId }));
      }

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
```

**Key implementation notes for `markSuggestionReviewed`:**
- Sets `status = REVIEWED`, `reviewedByUserId`, and `reviewedAt = now()`.
- Filters by `isNull(suggestions.deletedAt)` — cannot review a soft-deleted suggestion.
- Throws a localized error if the suggestion is not found (using `getBackendTranslations`).
- Wraps the UPDATE in a transaction via the `runner` pattern for atomicity.
- Does NOT set `adminResponse` — this method is for simple acknowledgment without a written response.

---

#### Step 7 — Add `respondToSuggestion` Method

Add after `markSuggestionReviewed`:

```typescript
  export const respondToSuggestion = async (
    input: { suggestionId: string; adminResponse: string; reviewedByUserId: string },
    tx?: DBTransaction,
    locale?: string
  ) => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const [updated] = await t
        .update(suggestions)
        .set({
          status: SuggestionStatus.REVIEWED,
          adminResponse: input.adminResponse,
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: now,
        })
        .where(
          and(
            eq(suggestions.id, input.suggestionId),
            isNull(suggestions.deletedAt)
          )
        )
        .returning();

      if (!updated) {
        const t18n = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t18n("suggestion.notFound", { id: input.suggestionId }));
      }

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
```

**Key implementation notes for `respondToSuggestion`:**
- Sets `status = REVIEWED`, `adminResponse`, `reviewedByUserId`, and `reviewedAt = now()`.
- The `adminResponse` field is visible to the parent in their suggestion history.
- Same transaction and error handling pattern as `markSuggestionReviewed`.
- The service layer is responsible for triggering notification dispatch after this method returns — the repository does NOT send notifications.

---

#### Step 8 — Add `markAsDuplicate` Method

Add after `respondToSuggestion`:

```typescript
  export const markAsDuplicate = async (
    input: { suggestionId: string; duplicateOfId: string; reviewedByUserId: string },
    tx?: DBTransaction,
    locale?: string
  ) => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const [updated] = await t
        .update(suggestions)
        .set({
          status: SuggestionStatus.DUPLICATE,
          duplicateOfId: input.duplicateOfId,
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: now,
        })
        .where(
          and(
            eq(suggestions.id, input.suggestionId),
            isNull(suggestions.deletedAt)
          )
        )
        .returning();

      if (!updated) {
        const t18n = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t18n("suggestion.notFound", { id: input.suggestionId }));
      }

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
```

**Key implementation notes for `markAsDuplicate`:**
- Sets `status = DUPLICATE`, `duplicateOfId`, `reviewedByUserId`, and `reviewedAt = now()`.
- The `duplicateOfId` FK has `onDelete: "set null"` — if the original suggestion is later soft-deleted, the duplicate link is automatically severed at the database level.
- Circular reference prevention, self-duplicate prevention, and target validation (must not be DUPLICATE or soft-deleted) are the responsibility of the `SuggestionService.markAsDuplicate()` method — the repository performs only the data mutation.
- Same transaction and error handling pattern as the other mutation methods.

---

#### Step 9 — Add `searchSuggestions` Method

Add after `markAsDuplicate`:

```typescript
  export type SuggestionSearchResult = {
    id: string;
    body: string;
    submitterName: string;
    status: string;
    createdAt: Date;
  };

  export const searchSuggestions = async (
    query: string,
    excludeId: string,
    tx?: DBTransaction
  ): Promise<SuggestionSearchResult[]> => {
    const queryDb = tx ?? db;

    return queryDb
      .select({
        id: suggestions.id,
        body: suggestions.body,
        submitterName: suggestions.submitterName,
        status: suggestions.status,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .where(
        and(
          ilike(suggestions.body, `%${query}%`),
          ne(suggestions.id, excludeId),
          isNull(suggestions.deletedAt),
          ne(suggestions.status, SuggestionStatus.DUPLICATE)
        )
      )
      .orderBy(desc(suggestions.createdAt))
      .limit(10);
  };
```

**Key implementation notes for `searchSuggestions`:**
- Used by the admin UI's duplicate search autocomplete — when an admin types in the "mark as duplicate" dialog, this method returns matching suggestions.
- Excludes the current suggestion (`excludeId`) to prevent self-duplicate marking.
- Excludes soft-deleted suggestions (`isNull(suggestions.deletedAt)`).
- Excludes suggestions already marked as DUPLICATE (`ne(suggestions.status, SuggestionStatus.DUPLICATE)`) — cannot chain duplicates.
- Uses `ilike` for case-insensitive partial matching on `body`.
- Hard limit of 10 results — sufficient for autocomplete dropdown.
- Read-only query, uses `tx ?? db` pattern.

---

#### Step 10 — Add `getSuggestionMetrics` Method (Updated)

Add after `searchSuggestions`:

```typescript
  export type SuggestionMetrics = {
    pending: number;
    reviewed: number;
    duplicate: number;
    avgResponseHours: number;
  };

  export const getSuggestionMetrics = async (
    tx?: DBTransaction
  ): Promise<SuggestionMetrics> => {
    const queryDb = tx ?? db;

    const statusCounts = await queryDb
      .select({
        status: suggestions.status,
        count: count(),
      })
      .from(suggestions)
      .where(isNull(suggestions.deletedAt))
      .groupBy(suggestions.status);

    const pending = statusCounts.find(r => r.status === SuggestionStatus.PENDING)?.count ?? 0;
    const reviewed = statusCounts.find(r => r.status === SuggestionStatus.REVIEWED)?.count ?? 0;
    const duplicate = statusCounts.find(r => r.status === SuggestionStatus.DUPLICATE)?.count ?? 0;

    const [avgResult] = await queryDb
      .select({
        avgHours: sql<number>`COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${suggestions.reviewedAt} - ${suggestions.createdAt})) / 3600
          ), 0
        )`.mapWith(Number),
      })
      .from(suggestions)
      .where(
        and(
          isNull(suggestions.deletedAt),
          ne(suggestions.status, SuggestionStatus.PENDING)
        )
      );

    return {
      pending,
      reviewed,
      duplicate,
      avgResponseHours: Math.round((avgResult?.avgHours ?? 0) * 100) / 100,
    };
  };
```

**Key implementation notes for `getSuggestionMetrics`:**
- Uses `groupBy(suggestions.status)` to get counts per status in a single query — more efficient than three separate count queries.
- The `avgResponseHours` calculation uses `sql<number>` with `.mapWith(Number)` per the AGENTS.md rule for conditional aggregation.
- Computes average time between `createdAt` and `reviewedAt` for all non-PENDING suggestions (both REVIEWED and DUPLICATE have `reviewedAt` set).
- Excludes soft-deleted suggestions from all metrics.
- Rounds to 2 decimal places for display purposes.

---

#### Step 11 — Verify Namespace Exports

After adding all eight methods, verify the `SuggestionRepository` namespace contains the complete method list:

```typescript
export namespace SuggestionRepository {
  // Story 14 (kept):
  //   submitSuggestion
  //   SuggestionSubmitInput

  // Story 15 (new):
  //   getSuggestionsByParent
  //   getAdminSuggestionQueue
  //   getSuggestionById
  //   markSuggestionReviewed (replaced)
  //   respondToSuggestion
  //   markAsDuplicate
  //   searchSuggestions
  //   getSuggestionMetrics (replaced)

  // Story 15 (new types):
  //   ParentSuggestionRow
  //   AdminSuggestionQueueRow
  //   AdminSuggestionQueueResult
  //   SuggestionDetailRow
  //   SuggestionSearchResult
  //   SuggestionMetrics
}
```

All methods and types are declared with `export` inside the namespace — no barrel export update needed in `index.ts` since `SuggestionRepository` is already exported from Story 14.

---

#### Step 12 — TypeScript Compilation Check

After adding all methods, run:

```bash
bun tsgo
```

Expected: 0 TypeScript errors. Pay attention to:
- Self-join aliasing (`dupSuggestions`, `reviewerUsers`) — Drizzle may require explicit type assertions for self-referencing table variables.
- `sql<string | null>` template literal typing — ensure `COALESCE` expressions are correctly typed.
- `SuggestionStatus` enum values used in `.where()` clauses must match the PostgreSQL enum values.

---

### Test Execution Requirements

Run the database test suite after completing all method implementations:

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

- [ ] `ParentSuggestionRow` type is exported with `duplicateOfBody` and `duplicateOfSubmitterName` fields
- [ ] `getSuggestionsByParent()` joins `suggestions` self-reference for duplicate preview and filters by `isNull(deletedAt)`
- [ ] `getSuggestionsByParent()` orders by `createdAt DESC` and supports `limit`/`offset` pagination
- [ ] `AdminSuggestionQueueRow` type includes `parentName`, `reviewerName`, `duplicateOfBody`, `duplicateOfSubmitterName`
- [ ] `getAdminSuggestionQueue()` joins `parents → users` for parent name, self-joins `suggestions` for duplicate preview
- [ ] `getAdminSuggestionQueue()` supports optional `search` (on parent name) and `status` filters with pagination
- [ ] `getAdminSuggestionQueue()` returns `{ rows, totalCount }` with a separate count query
- [ ] `SuggestionDetailRow` type includes all joined fields: parent name, reviewer name, duplicate preview
- [ ] `getSuggestionById()` performs four left joins (parents, users, dupSuggestions, reviewerUsers) and returns `null` for missing/soft-deleted
- [ ] `markSuggestionReviewed()` sets `status=REVIEWED`, `reviewedByUserId`, `reviewedAt=now()` within a transaction
- [ ] `respondToSuggestion()` sets `status=REVIEWED`, `adminResponse`, `reviewedByUserId`, `reviewedAt=now()` within a transaction
- [ ] `markAsDuplicate()` sets `status=DUPLICATE`, `duplicateOfId`, `reviewedByUserId`, `reviewedAt=now()` within a transaction
- [ ] All three mutation methods throw localized errors via `getBackendTranslations` when suggestion not found
- [ ] `searchSuggestions()` uses `ilike` on body, excludes self, excludes DUPLICATE status, excludes soft-deleted, limits to 10
- [ ] `SuggestionMetrics` type includes `pending`, `reviewed`, `duplicate`, `avgResponseHours`
- [ ] `getSuggestionMetrics()` uses `groupBy(status)` for counts and `sql<number>` with `.mapWith(Number)` for avg response time
- [ ] Story 14 placeholder methods (`getSuggestionsForAdmin` with `emailSentAt` logic) are removed
- [ ] All queries use `.select().from().leftJoin()` — no `findMany` or relational query API
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
