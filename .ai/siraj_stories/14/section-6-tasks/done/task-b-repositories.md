### Task B — Repositories: Complaint, Complaint Response, and Suggestion CRUD

---

**Objective**
Implement three new Drizzle ORM repository modules — `ComplaintRepository`, `ComplaintResponseRepository`, and `SuggestionRepository` — providing pure data-access CRUD for the complaints, complaint responses, and suggestions tables. Each repository follows the established namespace pattern, uses `.select().from().leftJoin()` queries (never relational `findMany`), and accepts optional `tx` and `locale` parameters.

**Dependencies**
- Task A (Schema & Enums) must be complete — the tables `complaints`, `complaintResponses`, `suggestions` and enums `ComplaintCategory`, `ComplaintStatus` must exist in `backend/db/schema/communications.ts` and `shared/lib/enum.ts`.

**Layer-Specific Rules**
- Drizzle ORM exclusively — no raw SQL outside `sql` template literals.
- Use `.select().from().leftJoin()` instead of relational `findMany`.
- Repositories are strictly for data access — no business logic, no permission checking.
- No hardcoded error strings — use `getBackendTranslations` with optional `locale?: string`.
- Use `sql<number>` with `.mapWith(Number)` for conditional aggregation.

**Target Files**
| File | Action |
|------|--------|
| `backend/db/repo/complaint.repository.ts` | CREATE |
| `backend/db/repo/complaint-response.repository.ts` | CREATE |
| `backend/db/repo/suggestion.repository.ts` | CREATE |
| `backend/db/repo/index.ts` | MODIFY — append 3 exports |

---

### Detailed Implementation Steps

#### Step 1 — Create `backend/db/repo/complaint.repository.ts`

```typescript
import { and, count, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaints, parents, students, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { ComplaintStatus } from "@/shared/lib/enum";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ComplaintSubmitInput {
  parentId: string;
  studentId?: string | null;
  category: "REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER";
  submitterEmail: string;
  body: string;
}

export namespace ComplaintRepository {
  export const submitComplaint = async (
    input: ComplaintSubmitInput,
    tx?: DBTransaction,
    locale?: string
  ) => {
    const queryDb = tx ?? db;
    const now = new Date();

    const [created] = await queryDb
      .insert(complaints)
      .values({
        parentId: input.parentId,
        studentId: input.studentId ?? null,
        category: input.category,
        submitterEmail: input.submitterEmail,
        body: input.body,
        status: ComplaintStatus.UNANSWERED,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("complaint.createFailed"));
    }

    return created;
  };

  export const getComplaintsByParent = async (
    parentId: string,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;

    return queryDb
      .select({
        id: complaints.id,
        parentId: complaints.parentId,
        studentId: complaints.studentId,
        studentName: students.name,
        category: complaints.category,
        submitterEmail: complaints.submitterEmail,
        body: complaints.body,
        status: complaints.status,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
      })
      .from(complaints)
      .leftJoin(students, eq(complaints.studentId, students.id))
      .where(and(eq(complaints.parentId, parentId), isNull(complaints.deletedAt)))
      .orderBy(desc(complaints.createdAt));
  };

  export type AdminComplaintQueueRow = {
    id: string;
    parentId: string;
    parentName: string;
    studentId: string | null;
    studentName: string | null;
    category: string;
    submitterEmail: string;
    body: string;
    status: string;
    responseCount: number;
    createdAt: Date;
    updatedAt: Date;
  };

  export type AdminComplaintQueueResult = {
    rows: AdminComplaintQueueRow[];
    totalCount: number;
  };

  export const getAdminComplaintQueue = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<AdminComplaintQueueResult> => {
    const queryDb = tx ?? db;

    const conditions = [isNull(complaints.deletedAt)];

    if (options.status) {
      conditions.push(eq(complaints.status, options.status as ComplaintStatus));
    }

    if (options.search) {
      conditions.push(
        ilike(users.name, `%${options.search}%`)
      );
    }

    const whereClause = and(...conditions);

    const rows = await queryDb
      .select({
        id: complaints.id,
        parentId: complaints.parentId,
        parentName: users.name,
        studentId: complaints.studentId,
        studentName: students.name,
        category: complaints.category,
        submitterEmail: complaints.submitterEmail,
        body: complaints.body,
        status: complaints.status,
        responseCount: sql<number>`(
          SELECT COUNT(*) FROM complaint_responses
          WHERE complaint_responses.complaint_id = ${complaints.id}
        )`.mapWith(Number),
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
      })
      .from(complaints)
      .leftJoin(parents, eq(complaints.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .leftJoin(students, eq(complaints.studentId, students.id))
      .where(whereClause)
      .orderBy(desc(complaints.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totalCount] = await queryDb
      .select({ count: count() })
      .from(complaints)
      .leftJoin(parents, eq(complaints.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(whereClause);

    return {
      rows,
      totalCount: totalCount?.count ?? 0,
    };
  };

  export const getComplaintById = async (
    complaintId: string,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: complaints.id,
        parentId: complaints.parentId,
        parentName: users.name,
        studentId: complaints.studentId,
        studentName: students.name,
        category: complaints.category,
        submitterEmail: complaints.submitterEmail,
        body: complaints.body,
        status: complaints.status,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
      })
      .from(complaints)
      .leftJoin(parents, eq(complaints.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .leftJoin(students, eq(complaints.studentId, students.id))
      .where(and(eq(complaints.id, complaintId), isNull(complaints.deletedAt)))
      .limit(1);

    return results[0] ?? null;
  };

  export type ComplaintMetrics = {
    unanswered: number;
    answered: number;
    avgResolutionHours: number;
  };

  export const getComplaintMetrics = async (
    tx?: DBTransaction
  ): Promise<ComplaintMetrics> => {
    const queryDb = tx ?? db;

    const statusCounts = await queryDb
      .select({
        status: complaints.status,
        count: count(),
      })
      .from(complaints)
      .where(isNull(complaints.deletedAt))
      .groupBy(complaints.status);

    const unanswered = statusCounts.find(r => r.status === ComplaintStatus.UNANSWERED)?.count ?? 0;
    const answered = statusCounts.find(r => r.status === ComplaintStatus.ANSWERED)?.count ?? 0;

    const [avgResult] = await queryDb
      .select({
        avgHours: sql<number>`COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${complaints.updatedAt} - ${complaints.createdAt})) / 3600
          ), 0
        )`.mapWith(Number),
      })
      .from(complaints)
      .where(and(eq(complaints.status, ComplaintStatus.ANSWERED), isNull(complaints.deletedAt)));

    return {
      unanswered,
      answered,
      avgResolutionHours: Math.round((avgResult?.avgHours ?? 0) * 100) / 100,
    };
  };

  export const getUnansweredComplaints = async (
    limit: number,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;

    return queryDb
      .select({
        id: complaints.id,
        body: complaints.body,
        createdAt: complaints.createdAt,
      })
      .from(complaints)
      .where(and(eq(complaints.status, ComplaintStatus.UNANSWERED), isNull(complaints.deletedAt)))
      .orderBy(desc(complaints.createdAt))
      .limit(limit);
  };
}
```

---

#### Step 2 — Create `backend/db/repo/complaint-response.repository.ts`

```typescript
import { desc, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaintResponses, complaints, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { ComplaintStatus } from "@/shared/lib/enum";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ComplaintResponseInput {
  complaintId: string;
  responderUserId?: string | null;
  body: string;
  emailSent: boolean;
}

export namespace ComplaintResponseRepository {
  export const createResponse = async (
    input: ComplaintResponseInput,
    tx?: DBTransaction,
    locale?: string
  ) => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const [created] = await t
        .insert(complaintResponses)
        .values({
          complaintId: input.complaintId,
          responderUserId: input.responderUserId ?? null,
          body: input.body,
          emailSent: input.emailSent,
          createdAt: now,
        })
        .returning();

      if (!created) {
        const tr = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tr("complaintResponse.createFailed"));
      }

      await t
        .update(complaints)
        .set({ status: ComplaintStatus.ANSWERED, updatedAt: now })
        .where(eq(complaints.id, input.complaintId));

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getResponsesByComplaint = async (
    complaintId: string,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;

    return queryDb
      .select({
        id: complaintResponses.id,
        complaintId: complaintResponses.complaintId,
        responderUserId: complaintResponses.responderUserId,
        responderName: users.name,
        body: complaintResponses.body,
        emailSent: complaintResponses.emailSent,
        createdAt: complaintResponses.createdAt,
      })
      .from(complaintResponses)
      .leftJoin(users, eq(complaintResponses.responderUserId, users.id))
      .where(eq(complaintResponses.complaintId, complaintId))
      .orderBy(desc(complaintResponses.createdAt));
  };
}
```

---

#### Step 3 — Create `backend/db/repo/suggestion.repository.ts`

```typescript
import { and, count, desc, eq, ilike, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { parents, suggestions, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface SuggestionSubmitInput {
  parentId: string;
  submitterName: string;
  body: string;
}

export namespace SuggestionRepository {
  export const submitSuggestion = async (
    input: SuggestionSubmitInput,
    tx?: DBTransaction,
    locale?: string
  ) => {
    const queryDb = tx ?? db;
    const now = new Date();

    const [created] = await queryDb
      .insert(suggestions)
      .values({
        parentId: input.parentId,
        submitterName: input.submitterName,
        body: input.body,
        createdAt: now,
      })
      .returning();

    if (!created) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("suggestion.createFailed"));
    }

    return created;
  };

  export type AdminSuggestionRow = {
    id: string;
    parentId: string;
    parentName: string;
    submitterName: string;
    body: string;
    emailSentAt: Date | null;
    createdAt: Date;
  };

  export type AdminSuggestionResult = {
    rows: AdminSuggestionRow[];
    totalCount: number;
  };

  export const getSuggestionsForAdmin = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<AdminSuggestionResult> => {
    const queryDb = tx ?? db;

    const conditions = [];

    if (options.status === "PENDING") {
      conditions.push(isNull(suggestions.emailSentAt));
    } else if (options.status === "REVIEWED") {
      conditions.push(isNotNull(suggestions.emailSentAt));
    }

    if (options.search) {
      conditions.push(ilike(users.name, `%${options.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await queryDb
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        parentName: users.name,
        submitterName: suggestions.submitterName,
        body: suggestions.body,
        emailSentAt: suggestions.emailSentAt,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
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

  export type SuggestionMetrics = {
    pending: number;
    reviewed: number;
    avgResponseHours: number;
  };

  export const getSuggestionMetrics = async (
    tx?: DBTransaction
  ): Promise<SuggestionMetrics> => {
    const queryDb = tx ?? db;

    const [pendingResult] = await queryDb
      .select({ count: count() })
      .from(suggestions)
      .where(isNull(suggestions.emailSentAt));

    const [reviewedResult] = await queryDb
      .select({ count: count() })
      .from(suggestions)
      .where(isNotNull(suggestions.emailSentAt));

    const [avgResult] = await queryDb
      .select({
        avgHours: sql<number>`COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${suggestions.emailSentAt} - ${suggestions.createdAt})) / 3600
          ), 0
        )`.mapWith(Number),
      })
      .from(suggestions)
      .where(isNotNull(suggestions.emailSentAt));

    return {
      pending: pendingResult?.count ?? 0,
      reviewed: reviewedResult?.count ?? 0,
      avgResponseHours: Math.round((avgResult?.avgHours ?? 0) * 100) / 100,
    };
  };

  export const markSuggestionReviewed = async (
    suggestionId: string,
    tx?: DBTransaction,
    locale?: string
  ) => {
    const queryDb = tx ?? db;
    const now = new Date();

    const [updated] = await queryDb
      .update(suggestions)
      .set({ emailSentAt: now })
      .where(eq(suggestions.id, suggestionId))
      .returning();

    if (!updated) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("suggestion.notFound", { id: suggestionId }));
    }

    return updated;
  };
}
```

---

#### Step 4 — Update `backend/db/repo/index.ts`

Append the following three lines to the end of `backend/db/repo/index.ts`:

```typescript
export { ComplaintRepository } from "./complaint.repository";
export { ComplaintResponseRepository } from "./complaint-response.repository";
export { SuggestionRepository } from "./suggestion.repository";
```

The final file should contain all existing exports plus these three new entries, sorted alphabetically.

---

### Test Execution Requirements

| Command | Purpose |
|---------|---------|
| `bun run test:db` | Run all database repository tests to verify no regressions |
| `bunx tsc --noEmit` | Verify TypeScript compilation with zero errors |
| `bun run lint` | Verify ESLint passes with no errors |

---

### Success Criteria

- [ ] `complaint.repository.ts` exports `ComplaintRepository` namespace with 6 methods: `submitComplaint`, `getComplaintsByParent`, `getAdminComplaintQueue`, `getComplaintById`, `getComplaintMetrics`, `getUnansweredComplaints`
- [ ] `complaint-response.repository.ts` exports `ComplaintResponseRepository` namespace with 2 methods: `createResponse`, `getResponsesByComplaint`
- [ ] `suggestion.repository.ts` exports `SuggestionRepository` namespace with 4 methods: `submitSuggestion`, `getSuggestionsForAdmin`, `getSuggestionMetrics`, `markSuggestionReviewed`
- [ ] `index.ts` barrel exports all three new repositories
- [ ] All queries use `.select().from().leftJoin()` — no `findMany` or relational query API
- [ ] All error messages use `getBackendTranslations` — no hardcoded strings
- [ ] Conditional aggregation uses `sql<number>` with `.mapWith(Number)`
- [ ] `createResponse` atomically inserts a response and updates complaint status within a transaction
- [ ] `getUnansweredComplaints` matches the existing query pattern in `notification-alerts.service.ts` for drop-in replacement
- [ ] `bun run test:db` passes with zero failures
- [ ] `bunx tsc --noEmit` reports zero type errors
- [ ] `bun run lint` reports zero lint errors

---

### Quality Gate — Pre-Submission Checklist

- [ ] All files created at correct paths
- [ ] No TypeScript `any` types used
- [ ] No hardcoded error strings — all use `getBackendTranslations`
- [ ] No business logic or permission checks in repositories
- [ ] All methods accept optional `tx?: DBTransaction` parameter
- [ ] Methods that mutate data accept optional `locale?: string` parameter
- [ ] Barrel export updated in `index.ts`
- [ ] Code follows existing repository naming and style conventions

### Quality Gate — Reviewer Checklist

- [ ] All Drizzle queries use `.select().from().leftJoin()` pattern
- [ ] `sql<number>` aggregation uses `.mapWith(Number)`
- [ ] `createResponse` wraps insert + update in a transaction
- [ ] `getAdminComplaintQueue` and `getSuggestionsForAdmin` support search, status filter, and pagination
- [ ] `getComplaintMetrics` and `getSuggestionMetrics` return correct aggregate structures
- [ ] `getUnansweredComplaints` is a direct replacement for the inline query in `notification-alerts.service.ts`
- [ ] No N+1 query patterns present
- [ ] All soft-delete filters (`isNull(deletedAt)`) applied where required
- [ ] Test suite passes: `bun run test:db`
- [ ] TypeScript compiles: `bunx tsc --noEmit`
- [ ] Linter passes: `bun run lint`
