### Task B4 — Repository Tests: Suggestion, Notification, and Complaint Extensions

---

**Objective**
Write comprehensive repository tests for all new and modified repository methods from Tasks B1, B2, and B3 — achieving 100% line and function coverage. Every public method must be tested for both success and failure paths, including soft-delete filtering, IDOR protection, transaction rollback, status filtering, pagination, search filtering, duplicate linking, SMS rate limiting, and batch delivery creation.

**Dependencies**
- Task B1 (SuggestionRepository extensions) must be complete — `getSuggestionsByParent`, `getAdminSuggestionQueue`, `getSuggestionById`, `markSuggestionReviewed`, `respondToSuggestion`, `markAsDuplicate`, `searchSuggestions`, `getSuggestionMetrics` must exist in `backend/db/repo/suggestion.repository.ts`.
- Task B2 (NotificationRepository extensions) must be complete — `getPreference`, `setPreference`, `createDeliveriesBatch`, `getSmsCountInLastHour`, `getDeliveriesByUser` must exist in `backend/db/repo/notification.repository.ts`.
- Task B3 (ComplaintRepository extensions) must be complete — `getComplaintFiles` must exist in `backend/db/repo/complaint.repository.ts`.

**Layer-Specific Rules**
- Read `backend/db/test/AGENTS.md` before writing any test code.
- Use `bun:test` for all test utilities (`describe`, `test`, `expect`).
- Every test MUST run inside `runInRollback` — no exceptions.
- Always pass `tx` to ALL repository method calls inside `runInRollback`.
- Use `expectRepoError` try/catch helper — NEVER use `expect(...).rejects.toThrow()`.
- Use entity-setup helpers (`createTestUser`, `createTestParent`, `createTestStudent`) — NEVER query seed data.
- Account for pre-existing data when asserting counts — fetch initial count first.
- Use higher-order test wrappers to reduce CodeScene duplication flags.
- No `console` methods — use `testLogger` or no logging.
- No `any` type overrides.

**Target Files**

| File | Action |
|------|--------|
| `backend/db/test/repo/suggestion.repository.test.ts` | EXTEND — Add new test suites for Story 15 methods |
| `backend/db/test/repo/notification.repository.test.ts` | EXTEND — Add new test suites for Story 15 methods |
| `backend/db/test/repo/complaint.repository.test.ts` | EXTEND — Add new test suites for Story 15 methods |

---

### Detailed Implementation Steps

---

#### Step 1 — Extend `backend/db/test/repo/suggestion.repository.test.ts`

Add the following test suites to the existing suggestion repository test file. The existing file already contains tests for `submitSuggestion`, `getSuggestionsForAdmin`, `getSuggestionMetrics`, and `markSuggestionReviewed` from Story 14. The new suites below test the Story 15 extensions: `getSuggestionsByParent`, `getAdminSuggestionQueue`, `getSuggestionById`, `respondToSuggestion`, `markAsDuplicate`, `searchSuggestions`, and updated `getSuggestionMetrics` with duplicate counts.

```typescript
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SuggestionRepository } from "@/backend/db/repo/suggestion.repository";
import { suggestions } from "@/backend/db/schema";
import { SuggestionStatus } from "@/shared/lib/enum";
import { createTestParent, createTestUser } from "../entity-setup";
import { type DbTransaction, runInRollback } from "../test-utils";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function suggestionTest(name: string, fn: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function setupParentForSuggestion(tx: DbTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);
  return { user, parent };
}

async function insertSuggestion(
  tx: DbTransaction,
  parentId: string,
  overrides: Partial<{
    submitterName: string;
    body: string;
    status: "PENDING" | "REVIEWED" | "DUPLICATE";
    adminResponse: string | null;
    reviewedByUserId: string | null;
    reviewedAt: Date | null;
    duplicateOfId: string | null;
    deletedAt: Date | null;
    createdAt: Date;
  }> = {}
) {
  const now = new Date();
  const [created] = await tx
    .insert(suggestions)
    .values({
      parentId,
      submitterName: overrides.submitterName ?? "Default Submitter",
      body: overrides.body ?? "Default suggestion body",
      status: overrides.status ?? "PENDING",
      adminResponse: overrides.adminResponse ?? null,
      reviewedByUserId: overrides.reviewedByUserId ?? null,
      reviewedAt: overrides.reviewedAt ?? null,
      duplicateOfId: overrides.duplicateOfId ?? null,
      deletedAt: overrides.deletedAt ?? null,
      createdAt: overrides.createdAt ?? now,
    })
    .returning();
  return created;
}

describe("SuggestionRepository — getSuggestionsByParent", () => {
  suggestionTest("returns only the specified parent's suggestions", async tx => {
    const parentA = await setupParentForSuggestion(tx, "SugParA");
    const parentB = await setupParentForSuggestion(tx, "SugParB");

    await insertSuggestion(tx, parentA.parent.id, { body: "Parent A suggestion" });
    await insertSuggestion(tx, parentB.parent.id, { body: "Parent B suggestion" });

    const resultA = await SuggestionRepository.getSuggestionsByParent(parentA.parent.id, tx);
    const resultB = await SuggestionRepository.getSuggestionsByParent(parentB.parent.id, tx);

    expect(resultA.length).toBeGreaterThanOrEqual(1);
    expect(resultA.every(s => s.parentId === parentA.parent.id)).toBeTrue();
    expect(resultA.some(s => s.body === "Parent A suggestion")).toBeTrue();
    expect(resultA.some(s => s.body === "Parent B suggestion")).toBeFalse();

    expect(resultB.length).toBeGreaterThanOrEqual(1);
    expect(resultB.every(s => s.parentId === parentB.parent.id)).toBeTrue();
  });

  suggestionTest("excludes soft-deleted suggestions", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugSoftDel");

    await insertSuggestion(tx, parent.id, { body: "Active suggestion" });
    await insertSuggestion(tx, parent.id, { body: "Deleted suggestion", deletedAt: new Date() });

    const result = await SuggestionRepository.getSuggestionsByParent(parent.id, tx);

    expect(result.some(s => s.body === "Active suggestion")).toBeTrue();
    expect(result.some(s => s.body === "Deleted suggestion")).toBeFalse();
  });

  suggestionTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugOrder");

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await insertSuggestion(tx, parent.id, { body: "Earlier suggestion", createdAt: earlier });
    await insertSuggestion(tx, parent.id, { body: "Later suggestion", createdAt: now });

    const result = await SuggestionRepository.getSuggestionsByParent(parent.id, tx);
    const filtered = result.filter(
      s => s.body === "Earlier suggestion" || s.body === "Later suggestion"
    );

    expect(filtered.length).toBe(2);
    expect(filtered[0].body).toBe("Later suggestion");
    expect(filtered[1].body).toBe("Earlier suggestion");
  });

  suggestionTest("includes duplicate preview when suggestion is DUPLICATE", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugDupPreview");

    const original = await insertSuggestion(tx, parent.id, {
      body: "Original suggestion",
      status: "REVIEWED",
    });

    await insertSuggestion(tx, parent.id, {
      body: "Duplicate suggestion",
      status: "DUPLICATE",
      duplicateOfId: original.id,
    });

    const result = await SuggestionRepository.getSuggestionsByParent(parent.id, tx);

    const dup = result.find(s => s.body === "Duplicate suggestion");
    expect(dup).toBeDefined();
    expect(dup?.status).toBe("DUPLICATE");
    expect(dup?.duplicateOfId).toBe(original.id);
    expect(dup?.duplicateOfBody).toBe("Original suggestion");
  });

  suggestionTest("returns empty array for unknown parentId", async tx => {
    const result = await SuggestionRepository.getSuggestionsByParent(
      "00000000-0000-0000-0000-000000000000",
      tx
    );
    expect(result).toEqual([]);
  });
});

describe("SuggestionRepository — getAdminSuggestionQueue", () => {
  suggestionTest("returns all suggestions with parent and reviewer names", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "AdminQSug");

    await insertSuggestion(tx, parent.id, {
      submitterName: "AdminQSug Parent",
      body: "Admin queue suggestion",
      status: "REVIEWED",
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    });

    const result = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);

    const matched = result.rows.find(r => r.body === "Admin queue suggestion");
    expect(matched).toBeDefined();
    expect(matched?.parentName).toBe("AdminQSug Parent");
    expect(matched?.submitterName).toBe("AdminQSug Parent");
    expect(matched?.reviewerName).toBe("AdminQSug Parent");
  });

  suggestionTest("filters by search term on parent name or submitter name", async tx => {
    const unique = `SrchSug-${randomUUID().slice(0, 8)}`;
    const user = await createTestUser(tx, { name: unique, email: `${unique}@test.com` });
    const parent = await createTestParent(tx, user.id);

    await insertSuggestion(tx, parent.id, { body: "Searchable admin suggestion" });

    const result = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 50, offset: 0, search: unique },
      tx
    );

    expect(result.rows.some(r => r.body === "Searchable admin suggestion")).toBeTrue();
  });

  suggestionTest("filters by PENDING status", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "PendAdm");

    await insertSuggestion(tx, parent.id, { body: "Pending admin", status: "PENDING" });
    await insertSuggestion(tx, parent.id, { body: "Reviewed admin", status: "REVIEWED" });

    const result = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 50, offset: 0, status: "PENDING" },
      tx
    );

    expect(result.rows.every(r => r.status === "PENDING")).toBeTrue();
    expect(result.rows.some(r => r.body === "Reviewed admin")).toBeFalse();
  });

  suggestionTest("filters by REVIEWED status", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "RevAdm");

    await insertSuggestion(tx, parent.id, { body: "Pending rev adm", status: "PENDING" });
    await insertSuggestion(tx, parent.id, { body: "Reviewed rev adm", status: "REVIEWED" });

    const result = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 50, offset: 0, status: "REVIEWED" },
      tx
    );

    expect(result.rows.some(r => r.body === "Reviewed rev adm")).toBeTrue();
    expect(result.rows.some(r => r.body === "Pending rev adm")).toBeFalse();
  });

  suggestionTest("filters by DUPLICATE status", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "DupAdm");

    const original = await insertSuggestion(tx, parent.id, {
      body: "Original for dup filter",
      status: "REVIEWED",
    });
    await insertSuggestion(tx, parent.id, {
      body: "Dup for filter",
      status: "DUPLICATE",
      duplicateOfId: original.id,
    });

    const result = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 50, offset: 0, status: "DUPLICATE" },
      tx
    );

    expect(result.rows.some(r => r.body === "Dup for filter")).toBeTrue();
    expect(result.rows.some(r => r.body === "Original for dup filter")).toBeFalse();
  });

  suggestionTest("supports pagination with limit and offset", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "PagAdmSug");

    for (let i = 0; i < 3; i++) {
      await insertSuggestion(tx, parent.id, { body: `Paginated admin suggestion ${i}` });
    }

    const page1 = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 2, offset: 0 },
      tx
    );
    const page2 = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 2, offset: 2 },
      tx
    );

    expect(page1.rows.length).toBeLessThanOrEqual(2);
    expect(page2.rows.length).toBeLessThanOrEqual(2);
    expect(page1.totalCount).toBeGreaterThanOrEqual(3);
  });

  suggestionTest("excludes soft-deleted suggestions", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "AdminSugSoft");

    await insertSuggestion(tx, parent.id, { body: "Visible admin suggestion" });
    await insertSuggestion(tx, parent.id, {
      body: "Hidden admin suggestion",
      deletedAt: new Date(),
    });

    const result = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.rows.some(r => r.body === "Visible admin suggestion")).toBeTrue();
    expect(result.rows.some(r => r.body === "Hidden admin suggestion")).toBeFalse();
  });
});

describe("SuggestionRepository — getSuggestionById", () => {
  suggestionTest("returns suggestion with joined parent and reviewer names", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "ByIdSug");

    const inserted = await insertSuggestion(tx, parent.id, {
      submitterName: "ByIdSug Parent",
      body: "Get by ID suggestion",
      status: "REVIEWED",
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    });

    const result = await SuggestionRepository.getSuggestionById(inserted.id, tx);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(inserted.id);
    expect(result?.parentName).toBe("ByIdSug Parent");
    expect(result?.body).toBe("Get by ID suggestion");
    expect(result?.reviewerName).toBe("ByIdSug Parent");
  });

  suggestionTest("returns null for non-existent suggestion ID", async tx => {
    const result = await SuggestionRepository.getSuggestionById(
      "00000000-0000-0000-0000-000000000000",
      tx
    );
    expect(result).toBeNull();
  });

  suggestionTest("excludes soft-deleted suggestions", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "ByIdSugSoft");

    const inserted = await insertSuggestion(tx, parent.id, {
      body: "Soft deleted by id suggestion",
      deletedAt: new Date(),
    });

    const result = await SuggestionRepository.getSuggestionById(inserted.id, tx);
    expect(result).toBeNull();
  });

  suggestionTest("includes duplicate info when status is DUPLICATE", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "ByIdDup");

    const original = await insertSuggestion(tx, parent.id, {
      body: "Original for byId",
      status: "REVIEWED",
    });

    const dup = await insertSuggestion(tx, parent.id, {
      body: "Duplicate for byId",
      status: "DUPLICATE",
      duplicateOfId: original.id,
    });

    const result = await SuggestionRepository.getSuggestionById(dup.id, tx);

    expect(result).not.toBeNull();
    expect(result?.status).toBe("DUPLICATE");
    expect(result?.duplicateOfId).toBe(original.id);
    expect(result?.duplicateOfBody).toBe("Original for byId");
  });
});

describe("SuggestionRepository — markSuggestionReviewed (Story 15)", () => {
  suggestionTest("sets status to REVIEWED with reviewedByUserId and reviewedAt", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "MarkRev15");

    const suggestion = await insertSuggestion(tx, parent.id, { status: "PENDING" });

    const result = await SuggestionRepository.markSuggestionReviewed(
      suggestion.id,
      user.id,
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(suggestion.id);
    expect(result.status).toBe("REVIEWED");
    expect(result.reviewedByUserId).toBe(user.id);
    expect(result.reviewedAt).not.toBeNull();
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  suggestionTest("throws for non-existent suggestion ID", async tx => {
    const { user } = await setupParentForSuggestion(tx, "MarkRevNF");

    const error = await expectRepoError(() =>
      SuggestionRepository.markSuggestionReviewed(
        "00000000-0000-0000-0000-000000000000",
        user.id,
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("SuggestionRepository — respondToSuggestion", () => {
  suggestionTest("sets adminResponse, status=REVIEWED, reviewedByUserId, reviewedAt", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "Respond");

    const suggestion = await insertSuggestion(tx, parent.id, { status: "PENDING" });

    const result = await SuggestionRepository.respondToSuggestion(
      suggestion.id,
      user.id,
      "Thank you for your feedback",
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(suggestion.id);
    expect(result.adminResponse).toBe("Thank you for your feedback");
    expect(result.status).toBe("REVIEWED");
    expect(result.reviewedByUserId).toBe(user.id);
    expect(result.reviewedAt).not.toBeNull();
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  suggestionTest("throws for non-existent suggestion ID", async tx => {
    const { user } = await setupParentForSuggestion(tx, "RespondNF");

    const error = await expectRepoError(() =>
      SuggestionRepository.respondToSuggestion(
        "00000000-0000-0000-0000-000000000000",
        user.id,
        "Should fail",
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  suggestionTest("overwrites existing adminResponse on re-response", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "ReRespond");

    const suggestion = await insertSuggestion(tx, parent.id, {
      status: "REVIEWED",
      adminResponse: "First response",
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    });

    const result = await SuggestionRepository.respondToSuggestion(
      suggestion.id,
      user.id,
      "Updated response",
      tx
    );

    expect(result.adminResponse).toBe("Updated response");
  });
});

describe("SuggestionRepository — markAsDuplicate", () => {
  suggestionTest("sets status=DUPLICATE, duplicateOfId, reviewedByUserId, reviewedAt", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "MarkDup");

    const original = await insertSuggestion(tx, parent.id, {
      body: "Original suggestion for dup",
      status: "REVIEWED",
    });

    const duplicate = await insertSuggestion(tx, parent.id, {
      body: "Duplicate to mark",
      status: "PENDING",
    });

    const result = await SuggestionRepository.markAsDuplicate(
      duplicate.id,
      original.id,
      user.id,
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(duplicate.id);
    expect(result.status).toBe("DUPLICATE");
    expect(result.duplicateOfId).toBe(original.id);
    expect(result.reviewedByUserId).toBe(user.id);
    expect(result.reviewedAt).not.toBeNull();
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  suggestionTest("throws for non-existent duplicate suggestion ID", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "MarkDupNF");

    const original = await insertSuggestion(tx, parent.id, { status: "REVIEWED" });

    const error = await expectRepoError(() =>
      SuggestionRepository.markAsDuplicate(
        "00000000-0000-0000-0000-000000000000",
        original.id,
        user.id,
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  suggestionTest("throws for non-existent original suggestion ID (FK violation)", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "MarkDupOrigNF");

    const duplicate = await insertSuggestion(tx, parent.id, { status: "PENDING" });

    const error = await expectRepoError(() =>
      SuggestionRepository.markAsDuplicate(
        duplicate.id,
        "00000000-0000-0000-0000-000000000000",
        user.id,
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("SuggestionRepository — searchSuggestions", () => {
  suggestionTest("returns suggestions matching ILIKE search on body", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SearchSug");

    await insertSuggestion(tx, parent.id, { body: "Add dark mode to the dashboard" });
    await insertSuggestion(tx, parent.id, { body: "Improve scheduling page" });

    const result = await SuggestionRepository.searchSuggestions("dark mode", tx);

    expect(result.some(s => s.body === "Add dark mode to the dashboard")).toBeTrue();
    expect(result.some(s => s.body === "Improve scheduling page")).toBeFalse();
  });

  suggestionTest("excludes the suggestion being searched from (self-exclusion)", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SearchSelf");

    const self = await insertSuggestion(tx, parent.id, { body: "Self exclusion test dark mode" });
    await insertSuggestion(tx, parent.id, { body: "Other dark mode suggestion" });

    const result = await SuggestionRepository.searchSuggestions("dark mode", tx, self.id);

    expect(result.some(s => s.id === self.id)).toBeFalse();
    expect(result.some(s => s.body === "Other dark mode suggestion")).toBeTrue();
  });

  suggestionTest("excludes soft-deleted suggestions", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SearchSoft");

    await insertSuggestion(tx, parent.id, {
      body: "Deleted dark mode suggestion",
      deletedAt: new Date(),
    });
    await insertSuggestion(tx, parent.id, { body: "Active dark mode suggestion" });

    const result = await SuggestionRepository.searchSuggestions("dark mode", tx);

    expect(result.some(s => s.body === "Deleted dark mode suggestion")).toBeFalse();
    expect(result.some(s => s.body === "Active dark mode suggestion")).toBeTrue();
  });

  suggestionTest("excludes suggestions with DUPLICATE status", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SearchDupExcl");

    const original = await insertSuggestion(tx, parent.id, {
      body: "Original for search dup",
      status: "REVIEWED",
    });

    await insertSuggestion(tx, parent.id, {
      body: "Duplicate dark mode search",
      status: "DUPLICATE",
      duplicateOfId: original.id,
    });

    await insertSuggestion(tx, parent.id, {
      body: "Active dark mode search",
      status: "PENDING",
    });

    const result = await SuggestionRepository.searchSuggestions("dark mode", tx);

    expect(result.some(s => s.body === "Duplicate dark mode search")).toBeFalse();
    expect(result.some(s => s.body === "Active dark mode search")).toBeTrue();
  });

  suggestionTest("limits results to 10", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SearchLimit");

    for (let i = 0; i < 15; i++) {
      await insertSuggestion(tx, parent.id, { body: `Limit test suggestion ${i} with keyword` });
    }

    const result = await SuggestionRepository.searchSuggestions("keyword", tx);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  suggestionTest("returns empty array for no matches", async tx => {
    const result = await SuggestionRepository.searchSuggestions(
      `nonexistent-${randomUUID().slice(0, 8)}`,
      tx
    );
    expect(result).toEqual([]);
  });
});

describe("SuggestionRepository — getSuggestionMetrics (Story 15)", () => {
  suggestionTest("returns correct counts for pending, reviewed, and duplicate", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugMetrics15");

    const beforeMetrics = await SuggestionRepository.getSuggestionMetrics(tx);
    const initialPending = beforeMetrics.pending;
    const initialReviewed = beforeMetrics.reviewed;
    const initialDuplicate = beforeMetrics.duplicate;

    await insertSuggestion(tx, parent.id, { status: "PENDING" });
    await insertSuggestion(tx, parent.id, { status: "PENDING" });
    await insertSuggestion(tx, parent.id, { status: "REVIEWED" });

    const original = await insertSuggestion(tx, parent.id, { status: "REVIEWED" });
    await insertSuggestion(tx, parent.id, {
      status: "DUPLICATE",
      duplicateOfId: original.id,
    });

    const metrics = await SuggestionRepository.getSuggestionMetrics(tx);

    expect(metrics.pending).toBe(initialPending + 2);
    expect(metrics.reviewed).toBe(initialReviewed + 2);
    expect(metrics.duplicate).toBe(initialDuplicate + 1);
  });

  suggestionTest("excludes soft-deleted from metrics", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugMetricsSoft");

    await insertSuggestion(tx, parent.id, { status: "PENDING", deletedAt: new Date() });

    const beforeMetrics = await SuggestionRepository.getSuggestionMetrics(tx);

    await insertSuggestion(tx, parent.id, { status: "PENDING" });

    const afterMetrics = await SuggestionRepository.getSuggestionMetrics(tx);

    expect(afterMetrics.pending).toBe(beforeMetrics.pending + 1);
  });
});

describe("SuggestionRepository — IDOR protection", () => {
  suggestionTest("Parent A cannot access Parent B's suggestions via getSuggestionsByParent", async tx => {
    const parentA = await setupParentForSuggestion(tx, "IdorSugA");
    const parentB = await setupParentForSuggestion(tx, "IdorSugB");

    await insertSuggestion(tx, parentB.parent.id, { body: "Parent B private suggestion" });

    const resultA = await SuggestionRepository.getSuggestionsByParent(parentA.parent.id, tx);

    expect(resultA.some(s => s.body === "Parent B private suggestion")).toBeFalse();
  });

  suggestionTest("Admin can access any suggestion via getAdminSuggestionQueue", async tx => {
    const parentA = await setupParentForSuggestion(tx, "IdorAdminA");
    const parentB = await setupParentForSuggestion(tx, "IdorAdminB");

    await insertSuggestion(tx, parentA.parent.id, { body: "Admin visible A" });
    await insertSuggestion(tx, parentB.parent.id, { body: "Admin visible B" });

    const result = await SuggestionRepository.getAdminSuggestionQueue(
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.rows.some(r => r.body === "Admin visible A")).toBeTrue();
    expect(result.rows.some(r => r.body === "Admin visible B")).toBeTrue();
  });
});

describe("SuggestionRepository — non-transactional coverage fallback (Story 15)", () => {
  test("supports getSuggestionsByParent without tx", async () => {
    const result = await SuggestionRepository.getSuggestionsByParent(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result).toEqual([]);
  });

  test("supports getAdminSuggestionQueue without tx", async () => {
    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 1, offset: 0 });
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe("number");
  });

  test("supports getSuggestionById without tx", async () => {
    const result = await SuggestionRepository.getSuggestionById(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result).toBeNull();
  });

  test("supports getSuggestionMetrics without tx", async () => {
    const metrics = await SuggestionRepository.getSuggestionMetrics();
    expect(typeof metrics.pending).toBe("number");
    expect(typeof metrics.reviewed).toBe("number");
    expect(typeof metrics.duplicate).toBe("number");
  });

  test("supports searchSuggestions without tx", async () => {
    const result = await SuggestionRepository.searchSuggestions(
      `nonexistent-${randomUUID().slice(0, 8)}`
    );
    expect(result).toEqual([]);
  });
});

describe("SuggestionRepository — transaction rollback (Story 15)", () => {
  test("rolls back respondToSuggestion on subsequent failure", async () => {
    let suggestionId: string | undefined;
    let originalStatus: string | undefined;

    await runInRollback(async tx => {
      const { parent, user } = await setupParentForSuggestion(tx, "RespondRB");
      const suggestion = await insertSuggestion(tx, parent.id, { status: "PENDING" });
      suggestionId = suggestion.id;
      originalStatus = suggestion.status;

      await SuggestionRepository.respondToSuggestion(
        suggestion.id,
        user.id,
        "Should be rolled back",
        tx
      );
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (suggestionId) {
      const [found] = await db
        .select()
        .from(suggestions)
        .where(eq(suggestions.id, suggestionId))
        .limit(1);
      if (found) {
        expect(found.status).toBe(originalStatus);
      }
    }
  });

  test("rolls back markAsDuplicate on subsequent failure", async () => {
    let duplicateId: string | undefined;
    let originalStatus: string | undefined;

    await runInRollback(async tx => {
      const { parent, user } = await setupParentForSuggestion(tx, "DupRB");
      const original = await insertSuggestion(tx, parent.id, { status: "REVIEWED" });
      const duplicate = await insertSuggestion(tx, parent.id, { status: "PENDING" });
      duplicateId = duplicate.id;
      originalStatus = duplicate.status;

      await SuggestionRepository.markAsDuplicate(duplicate.id, original.id, user.id, tx);
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (duplicateId) {
      const [found] = await db
        .select()
        .from(suggestions)
        .where(eq(suggestions.id, duplicateId))
        .limit(1);
      if (found) {
        expect(found.status).toBe(originalStatus);
      }
    }
  });
});
```

---

#### Step 2 — Extend `backend/db/test/repo/notification.repository.test.ts`

Add the following test suites to the existing notification repository test file. The existing file already contains tests for `registerDeviceToken`, `deactivateDeviceToken`, `getActiveDeviceTokensForUser`, `createDelivery`, `updateDeliveryStatus`, `recordDeliveryOpened`, `getDeliveryByProviderMessageId`, `handleDeliveryWebhook`, and `getDeliveryAnalytics` from Story 14. The new suites below test the Story 15 extensions.

```typescript
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { notificationDeliveries, userNotificationPreferences } from "@/backend/db/schema";
import { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";
import { createTestUser } from "../entity-setup";
import { type DbTransaction, runInRollback } from "../test-utils";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function notificationTest(name: string, fn: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

describe("NotificationRepository — getPreference", () => {
  notificationTest("returns preference row for existing user/channel/eventType", async tx => {
    const user = await createTestUser(tx, {
      name: "PrefGet User",
      email: `prefget-${randomUUID()}@test.com`,
    });

    await tx.insert(userNotificationPreferences).values({
      userId: user.id,
      channel: "EMAIL",
      eventType: "COMPLAINT_RESPONSE",
      enabled: true,
    });

    const result = await NotificationRepository.getPreference(
      user.id,
      "EMAIL",
      "COMPLAINT_RESPONSE",
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.userId).toBe(user.id);
    expect(result?.channel).toBe("EMAIL");
    expect(result?.eventType).toBe("COMPLAINT_RESPONSE");
    expect(result?.enabled).toBe(true);
  });

  notificationTest("returns null when no preference row exists", async tx => {
    const user = await createTestUser(tx, {
      name: "PrefNull User",
      email: `prefnull-${randomUUID()}@test.com`,
    });

    const result = await NotificationRepository.getPreference(
      user.id,
      "SMS",
      "COMPLAINT_RESPONSE",
      tx
    );

    expect(result).toBeNull();
  });
});

describe("NotificationRepository — setPreference", () => {
  notificationTest("creates new preference when none exists", async tx => {
    const user = await createTestUser(tx, {
      name: "PrefCreate User",
      email: `prefcreate-${randomUUID()}@test.com`,
    });

    const result = await NotificationRepository.setPreference(
      {
        userId: user.id,
        channel: "EMAIL",
        eventType: "COMPLAINT_RESPONSE",
        enabled: true,
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.userId).toBe(user.id);
    expect(result.channel).toBe("EMAIL");
    expect(result.eventType).toBe("COMPLAINT_RESPONSE");
    expect(result.enabled).toBe(true);
  });

  notificationTest("updates existing preference on conflict", async tx => {
    const user = await createTestUser(tx, {
      name: "PrefUpdate User",
      email: `prefupdate-${randomUUID()}@test.com`,
    });

    await NotificationRepository.setPreference(
      {
        userId: user.id,
        channel: "SMS",
        eventType: "COMPLAINT_RESPONSE",
        enabled: true,
      },
      tx
    );

    const updated = await NotificationRepository.setPreference(
      {
        userId: user.id,
        channel: "SMS",
        eventType: "COMPLAINT_RESPONSE",
        enabled: false,
      },
      tx
    );

    expect(updated.enabled).toBe(false);
  });

  notificationTest("creates preference for PUSH channel", async tx => {
    const user = await createTestUser(tx, {
      name: "PrefPush User",
      email: `prefpush-${randomUUID()}@test.com`,
    });

    const result = await NotificationRepository.setPreference(
      {
        userId: user.id,
        channel: "PUSH",
        eventType: "INVOICE_GENERATED",
        enabled: true,
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.channel).toBe("PUSH");
    expect(result.eventType).toBe("INVOICE_GENERATED");
  });
});

describe("NotificationRepository — createDeliveriesBatch", () => {
  notificationTest("creates multiple delivery rows atomically", async tx => {
    const user = await createTestUser(tx, {
      name: "BatchUser",
      email: `batch-${randomUUID()}@test.com`,
    });

    const deliveries = await NotificationRepository.createDeliveriesBatch(
      [
        {
          userId: user.id,
          channel: "EMAIL",
          eventType: "COMPLAINT_RESPONSE",
          title: "Email delivery",
          body: "Email body",
        },
        {
          userId: user.id,
          channel: "PUSH",
          eventType: "COMPLAINT_RESPONSE",
          title: "Push delivery",
          body: "Push body",
        },
        {
          userId: user.id,
          channel: "ON_APP",
          eventType: "COMPLAINT_RESPONSE",
          title: "OnApp delivery",
          body: "OnApp body",
        },
      ],
      tx
    );

    expect(deliveries.length).toBe(3);
    expect(deliveries.every(d => d.userId === user.id)).toBeTrue();
    expect(deliveries.every(d => d.status === "PENDING")).toBeTrue();
    expect(deliveries[0].channel).toBe("EMAIL");
    expect(deliveries[1].channel).toBe("PUSH");
    expect(deliveries[2].channel).toBe("ON_APP");
  });

  notificationTest("rolls back all rows on failure within transaction", async tx => {
    const user = await createTestUser(tx, {
      name: "BatchRB User",
      email: `batchrb-${randomUUID()}@test.com`,
    });

    let createdIds: string[] = [];

    try {
      await runInRollback(async innerTx => {
        const deliveries = await NotificationRepository.createDeliveriesBatch(
          [
            {
              userId: user.id,
              channel: "EMAIL",
              eventType: "COMPLAINT_RESPONSE",
              title: "Rollback email",
              body: "Should not persist",
            },
          ],
          innerTx
        );
        createdIds = deliveries.map(d => d.id);
        throw new Error("Simulated batch rollback");
      });
    } catch {
      // expected
    }

    for (const id of createdIds) {
      const [found] = await db
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.id, id))
        .limit(1);
      expect(found).toBeUndefined();
    }
  });

  notificationTest("creates empty array when given empty input", async tx => {
    const result = await NotificationRepository.createDeliveriesBatch([], tx);
    expect(result).toEqual([]);
  });
});

describe("NotificationRepository — getSmsCountInLastHour", () => {
  notificationTest("returns correct count within 1-hour window", async tx => {
    const user = await createTestUser(tx, {
      name: "SmsCount User",
      email: `smscount-${randomUUID()}@test.com`,
    });

    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "SMS",
      eventType: "COMPLAINT_RESPONSE",
      status: "SENT",
      title: "Recent SMS 1",
      createdAt: thirtyMinAgo,
      updatedAt: thirtyMinAgo,
    });

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "SMS",
      eventType: "COMPLAINT_RESPONSE",
      status: "SENT",
      title: "Recent SMS 2",
      createdAt: thirtyMinAgo,
      updatedAt: thirtyMinAgo,
    });

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "SMS",
      eventType: "COMPLAINT_RESPONSE",
      status: "SENT",
      title: "Old SMS",
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    });

    const count = await NotificationRepository.getSmsCountInLastHour(user.id, tx);

    expect(count).toBeGreaterThanOrEqual(2);
  });

  notificationTest("returns 0 for user with no SMS deliveries", async tx => {
    const user = await createTestUser(tx, {
      name: "SmsZero User",
      email: `smszero-${randomUUID()}@test.com`,
    });

    const count = await NotificationRepository.getSmsCountInLastHour(user.id, tx);

    expect(count).toBe(0);
  });

  notificationTest("excludes non-SMS channels from count", async tx => {
    const user = await createTestUser(tx, {
      name: "SmsExcl User",
      email: `smsexcl-${randomUUID()}@test.com`,
    });

    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "EMAIL",
      eventType: "COMPLAINT_RESPONSE",
      status: "SENT",
      title: "Email not SMS",
      createdAt: thirtyMinAgo,
      updatedAt: thirtyMinAgo,
    });

    const count = await NotificationRepository.getSmsCountInLastHour(user.id, tx);

    expect(count).toBe(0);
  });
});

describe("NotificationRepository — getDeliveriesByUser", () => {
  notificationTest("returns paginated deliveries for the user", async tx => {
    const user = await createTestUser(tx, {
      name: "DelivUser",
      email: `delivuser-${randomUUID()}@test.com`,
    });

    const now = new Date();

    for (let i = 0; i < 3; i++) {
      await tx.insert(notificationDeliveries).values({
        userId: user.id,
        channel: "EMAIL",
        eventType: "COMPLAINT_RESPONSE",
        status: "SENT",
        title: `Delivery ${i}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    const result = await NotificationRepository.getDeliveriesByUser(
      user.id,
      { limit: 2, offset: 0 },
      tx
    );

    expect(result.rows.length).toBeLessThanOrEqual(2);
    expect(result.totalCount).toBeGreaterThanOrEqual(3);
    expect(result.rows.every(r => r.userId === user.id)).toBeTrue();
  });

  notificationTest("filters by channel", async tx => {
    const user = await createTestUser(tx, {
      name: "DelivChan User",
      email: `delivchan-${randomUUID()}@test.com`,
    });

    const now = new Date();

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "EMAIL",
      eventType: "COMPLAINT_RESPONSE",
      status: "SENT",
      title: "Email delivery filter",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "PUSH",
      eventType: "COMPLAINT_RESPONSE",
      status: "SENT",
      title: "Push delivery filter",
      createdAt: now,
      updatedAt: now,
    });

    const result = await NotificationRepository.getDeliveriesByUser(
      user.id,
      { limit: 50, offset: 0, channel: "EMAIL" },
      tx
    );

    expect(result.rows.every(r => r.channel === "EMAIL")).toBeTrue();
    expect(result.rows.some(r => r.title === "Email delivery filter")).toBeTrue();
    expect(result.rows.some(r => r.title === "Push delivery filter")).toBeFalse();
  });

  notificationTest("filters by eventType", async tx => {
    const user = await createTestUser(tx, {
      name: "DelivEvent User",
      email: `delivevent-${randomUUID()}@test.com`,
    });

    const now = new Date();

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "EMAIL",
      eventType: "COMPLAINT_RESPONSE",
      status: "SENT",
      title: "Complaint event",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: "EMAIL",
      eventType: "INVOICE_GENERATED",
      status: "SENT",
      title: "Invoice event",
      createdAt: now,
      updatedAt: now,
    });

    const result = await NotificationRepository.getDeliveriesByUser(
      user.id,
      { limit: 50, offset: 0, eventType: "COMPLAINT_RESPONSE" },
      tx
    );

    expect(result.rows.every(r => r.eventType === "COMPLAINT_RESPONSE")).toBeTrue();
    expect(result.rows.some(r => r.title === "Invoice event")).toBeFalse();
  });

  notificationTest("returns empty for unknown user", async tx => {
    const result = await NotificationRepository.getDeliveriesByUser(
      "00000000-0000-0000-0000-000000000000",
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});

describe("NotificationRepository — non-transactional coverage fallback (Story 15)", () => {
  test("supports getPreference without tx", async () => {
    const result = await NotificationRepository.getPreference(
      "00000000-0000-0000-0000-000000000000",
      "EMAIL",
      "COMPLAINT_RESPONSE"
    );
    expect(result).toBeNull();
  });

  test("supports getSmsCountInLastHour without tx", async () => {
    const count = await NotificationRepository.getSmsCountInLastHour(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(count).toBe(0);
  });

  test("supports getDeliveriesByUser without tx", async () => {
    const result = await NotificationRepository.getDeliveriesByUser(
      "00000000-0000-0000-0000-000000000000",
      { limit: 1, offset: 0 }
    );
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
```

---

#### Step 3 — Extend `backend/db/test/repo/complaint.repository.test.ts`

Add the following test suite to the existing complaint repository test file. The existing file already contains tests for `submitComplaint`, `getComplaintsByParent`, `getAdminComplaintQueue`, `getComplaintById`, `getComplaintMetrics`, and `getUnansweredComplaints` from Story 14. The new suite below tests the Story 15 extension: `getComplaintFiles`.

```typescript
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ComplaintRepository } from "@/backend/db/repo/complaint.repository";
import { complaintFiles, complaints, storageFiles } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestUser } from "../entity-setup";
import { type DbTransaction, runInRollback } from "../test-utils";

function complaintTest(name: string, fn: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function setupParentWithStudent(tx: DbTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);
  const student = await createTestStudent(tx, parent.id, { name: `${namePrefix} Student` });
  return { user, parent, student };
}

async function insertComplaint(
  tx: DbTransaction,
  parentId: string,
  overrides: Partial<{
    studentId: string | null;
    category: "REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER";
    status: "UNANSWERED" | "ANSWERED";
    body: string;
    submitterEmail: string;
    deletedAt: Date | null;
  }> = {}
) {
  const now = new Date();
  const [created] = await tx
    .insert(complaints)
    .values({
      parentId,
      studentId: overrides.studentId ?? null,
      category: overrides.category ?? "OTHER",
      submitterEmail: overrides.submitterEmail ?? `submitter-${randomUUID()}@test.com`,
      body: overrides.body ?? "Test complaint body",
      status: overrides.status ?? "UNANSWERED",
      deletedAt: overrides.deletedAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return created;
}

async function insertStorageFile(tx: DbTransaction, filePath: string) {
  const [file] = await tx
    .insert(storageFiles)
    .values({
      path: filePath,
      isProtected: false,
    })
    .returning();
  return file;
}

describe("ComplaintRepository — getComplaintFiles", () => {
  complaintTest("returns files with storage file details for a complaint", async tx => {
    const { parent } = await setupParentWithStudent(tx, "FileGet");

    const complaint = await insertComplaint(tx, parent.id, { body: "Complaint with files" });

    const file1 = await insertStorageFile(tx, `complaints/test-file-1-${randomUUID()}.pdf`);
    const file2 = await insertStorageFile(tx, `complaints/test-file-2-${randomUUID()}.png`);

    await tx.insert(complaintFiles).values({
      fileId: file1.id,
      complaintId: complaint.id,
      usageType: "attachment",
    });

    await tx.insert(complaintFiles).values({
      fileId: file2.id,
      complaintId: complaint.id,
      usageType: "attachment",
    });

    const result = await ComplaintRepository.getComplaintFiles(complaint.id, tx);

    expect(result.length).toBe(2);
    expect(result.some(f => f.filePath === file1.path)).toBeTrue();
    expect(result.some(f => f.filePath === file2.path)).toBeTrue();
    expect(result.every(f => f.usageType === "attachment")).toBeTrue();
    expect(result.every(f => typeof f.fileId === "string")).toBeTrue();
  });

  complaintTest("returns empty array for complaint with no files", async tx => {
    const { parent } = await setupParentWithStudent(tx, "FileEmpty");

    const complaint = await insertComplaint(tx, parent.id, { body: "Complaint without files" });

    const result = await ComplaintRepository.getComplaintFiles(complaint.id, tx);

    expect(result).toEqual([]);
  });

  complaintTest("returns empty array for unknown complaintId", async tx => {
    const result = await ComplaintRepository.getComplaintFiles(
      "00000000-0000-0000-0000-000000000000",
      tx
    );
    expect(result).toEqual([]);
  });

  complaintTest("includes file metadata fields (id, path, usageType, createdAt)", async tx => {
    const { parent } = await setupParentWithStudent(tx, "FileMeta");

    const complaint = await insertComplaint(tx, parent.id, { body: "Complaint with metadata" });
    const file = await insertStorageFile(tx, `complaints/meta-file-${randomUUID()}.docx`);

    await tx.insert(complaintFiles).values({
      fileId: file.id,
      complaintId: complaint.id,
      usageType: "evidence",
    });

    const result = await ComplaintRepository.getComplaintFiles(complaint.id, tx);

    expect(result.length).toBe(1);
    expect(result[0].fileId).toBe(file.id);
    expect(result[0].filePath).toBe(file.path);
    expect(result[0].usageType).toBe("evidence");
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});

describe("ComplaintRepository — non-transactional coverage fallback (Story 15)", () => {
  test("supports getComplaintFiles without tx", async () => {
    const result = await ComplaintRepository.getComplaintFiles(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result).toEqual([]);
  });
});
```

---

### Test Execution Requirements

After completing all 3 test file extensions, run the following commands to verify correctness and coverage:

```bash
bun run test:db
bun run test:coverage backend/db/test/repo/suggestion.repository.test.ts
bun run test:coverage backend/db/test/repo/notification.repository.test.ts
bun run test:coverage backend/db/test/repo/complaint.repository.test.ts
```

---

### Success Criteria

- [ ] `suggestion.repository.test.ts` — all 8 Story 15 methods tested: `getSuggestionsByParent`, `getAdminSuggestionQueue`, `getSuggestionById`, `markSuggestionReviewed` (with reviewer), `respondToSuggestion`, `markAsDuplicate`, `searchSuggestions`, `getSuggestionMetrics` (with duplicate count)
- [ ] `notification.repository.test.ts` — all 5 Story 15 methods tested: `getPreference`, `setPreference`, `createDeliveriesBatch`, `getSmsCountInLastHour`, `getDeliveriesByUser`
- [ ] `complaint.repository.test.ts` — Story 15 method tested: `getComplaintFiles`
- [ ] 100% line coverage achieved for all 3 repository source files
- [ ] 100% function coverage achieved for all 3 repository source files
- [ ] All success paths tested (valid input creates/returns records)
- [ ] All failure paths tested (FK violations, non-existent IDs)
- [ ] IDOR protection verified — Parent A cannot access Parent B's suggestions via `getSuggestionsByParent`
- [ ] Admin override verified — `getAdminSuggestionQueue` returns all suggestions regardless of parent
- [ ] Soft-delete filtering verified — `deletedAt IS NULL` applied in `getSuggestionsByParent`, `getAdminSuggestionQueue`, `getSuggestionById`, `searchSuggestions`, `getSuggestionMetrics`
- [ ] Duplicate tracking verified — `markAsDuplicate` sets status, duplicateOfId, reviewer, timestamp
- [ ] Duplicate preview verified — `getSuggestionsByParent` and `getSuggestionById` include `duplicateOfBody` for DUPLICATE status
- [ ] Search filtering verified — `searchSuggestions` uses ILIKE, excludes self, excludes soft-deleted, excludes DUPLICATE, limits to 10
- [ ] Status filtering verified — PENDING/REVIEWED/DUPLICATE in admin queue
- [ ] Pagination verified — limit/offset in admin queue and deliveries by user
- [ ] Notification preference upsert verified — `setPreference` creates new, updates on conflict
- [ ] Batch delivery creation verified — `createDeliveriesBatch` creates multiple rows atomically
- [ ] SMS rate limiting verified — `getSmsCountInLastHour` counts only SMS within 1-hour window, excludes other channels
- [ ] Complaint file listing verified — `getComplaintFiles` returns files with storage file details, empty array for no files
- [ ] Transaction rollback verified — `respondToSuggestion` and `markAsDuplicate` data not persisted after rollback
- [ ] Non-transactional fallback paths tested — calls without `tx` parameter for all new methods
- [ ] `bun run test:db` passes with zero failures
- [ ] No `console` methods used — all logging via `testLogger` or omitted
- [ ] No `any` type overrides used
- [ ] All tests use `runInRollback` wrapper
- [ ] All repo method calls pass `tx` inside `runInRollback`

---

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
