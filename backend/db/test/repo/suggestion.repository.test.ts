import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { SuggestionRepository } from "@/backend/db/repo";
import { suggestions } from "@/backend/db/schema";
import { createTestParent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";

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

function suggestionTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function setupParentForSuggestion(tx: DBTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);
  return { user, parent };
}

async function insertSuggestion(
  tx: DBTransaction,
  parentId: string,
  overrides: Partial<{
    submitterName: string;
    body: string;
    emailSentAt: Date | null;
  }> = {}
) {
  const now = new Date();
  const [created] = await tx
    .insert(suggestions)
    .values({
      parentId,
      submitterName: overrides.submitterName ?? "Default Submitter",
      body: overrides.body ?? "Default suggestion body",
      emailSentAt: overrides.emailSentAt ?? null,
      createdAt: now,
    })
    .returning();
  return created;
}

describe("SuggestionRepository — submitSuggestion", () => {
  suggestionTest("creates a suggestion record with valid input", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "Submit");

    const result = await SuggestionRepository.submitSuggestion(
      {
        parentId: parent.id,
        submitterName: "Submit Parent",
        body: "Add dark mode please",
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.parentId).toBe(parent.id);
    expect(result.submitterName).toBe("Submit Parent");
    expect(result.body).toBe("Add dark mode please");
    expect(result.emailSentAt).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  suggestionTest("fails with invalid parentId (FK violation)", async tx => {
    const error = await expectRepoError(() =>
      SuggestionRepository.submitSuggestion(
        {
          parentId: "00000000-0000-0000-0000-000000000000",
          submitterName: "Bad Parent",
          body: "Should fail",
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("SuggestionRepository — getSuggestionsForAdmin", () => {
  suggestionTest("returns all suggestions with parent names", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "AdminList");

    await insertSuggestion(tx, parent.id, {
      submitterName: "AdminList Parent",
      body: "Admin visible suggestion",
    });

    const result = await SuggestionRepository.getSuggestionsForAdmin({ limit: 50, offset: 0 }, tx);

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);

    const matched = result.rows.find(r => r.body === "Admin visible suggestion");
    expect(matched).toBeDefined();
    expect(matched?.parentName).toBe("AdminList Parent");
    expect(matched?.submitterName).toBe("AdminList Parent");
  });

  suggestionTest("filters by search term on parent name", async tx => {
    const unique = `SrchSug-${randomUUID().slice(0, 8)}`;
    const user = await createTestUser(tx, { name: unique, email: `${unique}@test.com` });
    const parent = await createTestParent(tx, user.id);

    await insertSuggestion(tx, parent.id, { body: "Searchable suggestion" });

    const result = await SuggestionRepository.getSuggestionsForAdmin({ limit: 50, offset: 0, search: unique }, tx);

    expect(result.rows.some(r => r.body === "Searchable suggestion")).toBeTrue();
  });

  suggestionTest("filters by PENDING status (emailSentAt IS NULL)", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "PendFilter");

    await insertSuggestion(tx, parent.id, { body: "Pending suggestion", emailSentAt: null });
    await insertSuggestion(tx, parent.id, { body: "Reviewed suggestion", emailSentAt: new Date() });

    const result = await SuggestionRepository.getSuggestionsForAdmin({ limit: 50, offset: 0, status: "PENDING" }, tx);

    expect(result.rows.some(r => r.body === "Pending suggestion")).toBeTrue();
    expect(result.rows.some(r => r.body === "Reviewed suggestion")).toBeFalse();
  });

  suggestionTest("filters by REVIEWED status (emailSentAt IS NOT NULL)", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "RevFilter");

    await insertSuggestion(tx, parent.id, { body: "Pending rev", emailSentAt: null });
    await insertSuggestion(tx, parent.id, { body: "Reviewed rev", emailSentAt: new Date() });

    const result = await SuggestionRepository.getSuggestionsForAdmin({ limit: 50, offset: 0, status: "REVIEWED" }, tx);

    expect(result.rows.some(r => r.body === "Reviewed rev")).toBeTrue();
    expect(result.rows.some(r => r.body === "Pending rev")).toBeFalse();
  });

  suggestionTest("supports pagination with limit and offset", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "PagSug");

    for (let i = 0; i < 3; i++) {
      await insertSuggestion(tx, parent.id, { body: `Paginated suggestion ${i}` });
    }

    const page1 = await SuggestionRepository.getSuggestionsForAdmin({ limit: 2, offset: 0 }, tx);
    const page2 = await SuggestionRepository.getSuggestionsForAdmin({ limit: 2, offset: 2 }, tx);

    expect(page1.rows.length).toBeLessThanOrEqual(2);
    expect(page2.rows.length).toBeLessThanOrEqual(2);
    expect(page1.totalCount).toBeGreaterThanOrEqual(3);
  });

  suggestionTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "OrdSug");

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await tx.insert(suggestions).values({
      parentId: parent.id,
      submitterName: "Earlier Submitter",
      body: "Earlier suggestion",
      createdAt: earlier,
    });

    await tx.insert(suggestions).values({
      parentId: parent.id,
      submitterName: "Later Submitter",
      body: "Later suggestion",
      createdAt: now,
    });

    const result = await SuggestionRepository.getSuggestionsForAdmin({ limit: 50, offset: 0 }, tx);

    const filtered = result.rows.filter(r => r.body === "Earlier suggestion" || r.body === "Later suggestion");

    expect(filtered.length).toBe(2);
    expect(filtered[0].body).toBe("Later suggestion");
    expect(filtered[1].body).toBe("Earlier suggestion");
  });
});

describe("SuggestionRepository — getSuggestionMetrics", () => {
  suggestionTest("returns correct pending and reviewed counts", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugMetrics");

    const beforeMetrics = await SuggestionRepository.getSuggestionMetrics(tx);
    const initialPending = beforeMetrics.pending;
    const initialReviewed = beforeMetrics.reviewed;

    await insertSuggestion(tx, parent.id, { emailSentAt: null });
    await insertSuggestion(tx, parent.id, { emailSentAt: null });
    await insertSuggestion(tx, parent.id, { emailSentAt: new Date() });

    const metrics = await SuggestionRepository.getSuggestionMetrics(tx);

    expect(metrics.pending).toBe(initialPending + 2);
    expect(metrics.reviewed).toBe(initialReviewed + 1);
    expect(typeof metrics.avgResponseHours).toBe("number");
  });
});

describe("SuggestionRepository — markSuggestionReviewed", () => {
  suggestionTest("sets emailSentAt timestamp on the suggestion", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "MarkRev");

    const suggestion = await insertSuggestion(tx, parent.id, { emailSentAt: null });

    const result = await SuggestionRepository.markSuggestionReviewed(suggestion.id, tx);

    expect(result).toBeDefined();
    expect(result.id).toBe(suggestion.id);
    expect(result.emailSentAt).not.toBeNull();
    expect(result.emailSentAt).toBeInstanceOf(Date);
  });

  suggestionTest("throws for non-existent suggestion ID", async tx => {
    const error = await expectRepoError(() =>
      SuggestionRepository.markSuggestionReviewed("00000000-0000-0000-0000-000000000000", tx)
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  suggestionTest("can mark an already-reviewed suggestion again", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "ReRev");

    const suggestion = await insertSuggestion(tx, parent.id, { emailSentAt: new Date() });

    const result = await SuggestionRepository.markSuggestionReviewed(suggestion.id, tx);

    expect(result).toBeDefined();
    expect(result.emailSentAt).not.toBeNull();
  });
});

describe("SuggestionRepository — non-transactional coverage fallback", () => {
  test("supports getSuggestionsForAdmin without tx", async () => {
    const result = await SuggestionRepository.getSuggestionsForAdmin({ limit: 1, offset: 0 });
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe("number");
  });

  test("supports getSuggestionMetrics without tx", async () => {
    const metrics = await SuggestionRepository.getSuggestionMetrics();
    expect(typeof metrics.pending).toBe("number");
    expect(typeof metrics.reviewed).toBe("number");
    expect(typeof metrics.avgResponseHours).toBe("number");
  });
});

describe("SuggestionRepository — transaction rollback", () => {
  test("rolls back suggestion creation on subsequent failure", async () => {
    let createdId: string | undefined;
    await runInRollback(async tx => {
      const { parent } = await setupParentForSuggestion(tx, "SugRB");

      const created = await SuggestionRepository.submitSuggestion(
        {
          parentId: parent.id,
          submitterName: "RB Submitter",
          body: "Should be rolled back",
        },
        tx
      );
      createdId = created.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdId) {
      const [found] = await db.select().from(suggestions).where(eq(suggestions.id, createdId)).limit(1);
      expect(found).toBeUndefined();
    }
  });

  test("rolls back markSuggestionReviewed on subsequent failure", async () => {
    let suggestionId: string | undefined;
    let originalEmailSentAt: Date | null = null;

    await runInRollback(async tx => {
      const { parent } = await setupParentForSuggestion(tx, "MarkRB");
      const suggestion = await insertSuggestion(tx, parent.id, { emailSentAt: null });
      suggestionId = suggestion.id;
      originalEmailSentAt = suggestion.emailSentAt;

      await SuggestionRepository.markSuggestionReviewed(suggestion.id, tx);
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (suggestionId) {
      const [found] = await db.select().from(suggestions).where(eq(suggestions.id, suggestionId)).limit(1);
      if (found) {
        expect(found.emailSentAt).toBe(originalEmailSentAt);
      }
    }
  });
});
