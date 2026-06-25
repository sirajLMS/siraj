import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { SuggestionRepository } from "@/backend/db/repo";
import { suggestions } from "@/backend/db/schema";
import { SuggestionStatus } from "@/shared/lib/enum";
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
  const result = await tx
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
  const rows = result as unknown as Array<{
    id: string;
    parentId: string;
    submitterName: string;
    body: string;
    status: string;
    adminResponse: string | null;
    reviewedByUserId: string | null;
    reviewedAt: Date | null;
    duplicateOfId: string | null;
    deletedAt: Date | null;
    emailSentAt: Date | null;
    createdAt: Date;
  }>;
  return rows[0];
}

describe("SuggestionRepository — submitSuggestion", () => {
  suggestionTest("creates a suggestion record with valid input", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "Submit15");

    const result = await SuggestionRepository.submitSuggestion(
      {
        parentId: parent.id,
        submitterName: "Submit15 Parent",
        body: "Add dark mode please",
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.parentId).toBe(parent.id);
    expect(result.submitterName).toBe("Submit15 Parent");
    expect(result.body).toBe("Add dark mode please");
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

describe("SuggestionRepository — getSuggestionsByParent", () => {
  suggestionTest("returns only the specified parent's suggestions", async tx => {
    const parentA = await setupParentForSuggestion(tx, "SugParA");
    const parentB = await setupParentForSuggestion(tx, "SugParB");

    await insertSuggestion(tx, parentA.parent.id, { body: "Parent A suggestion" });
    await insertSuggestion(tx, parentB.parent.id, { body: "Parent B suggestion" });

    const resultA = await SuggestionRepository.getSuggestionsByParent(parentA.parent.id, { limit: 50, offset: 0 }, tx);
    const resultB = await SuggestionRepository.getSuggestionsByParent(parentB.parent.id, { limit: 50, offset: 0 }, tx);

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

    const result = await SuggestionRepository.getSuggestionsByParent(parent.id, { limit: 50, offset: 0 }, tx);

    expect(result.some(s => s.body === "Active suggestion")).toBeTrue();
    expect(result.some(s => s.body === "Deleted suggestion")).toBeFalse();
  });

  suggestionTest("returns results ordered by createdAt DESC", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugOrder");

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await insertSuggestion(tx, parent.id, { body: "Earlier suggestion", createdAt: earlier });
    await insertSuggestion(tx, parent.id, { body: "Later suggestion", createdAt: now });

    const result = await SuggestionRepository.getSuggestionsByParent(parent.id, { limit: 50, offset: 0 }, tx);
    const filtered = result.filter(s => s.body === "Earlier suggestion" || s.body === "Later suggestion");

    expect(filtered.length).toBe(2);
    expect(filtered[0].body).toBe("Later suggestion");
    expect(filtered[1].body).toBe("Earlier suggestion");
  });

  suggestionTest("includes duplicate preview when suggestion is DUPLICATE", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SugDupPrev");

    const original = await insertSuggestion(tx, parent.id, {
      body: "Original suggestion",
      status: "REVIEWED",
    });

    await insertSuggestion(tx, parent.id, {
      body: "Duplicate suggestion",
      status: "DUPLICATE",
      duplicateOfId: original.id,
    });

    const result = await SuggestionRepository.getSuggestionsByParent(parent.id, { limit: 50, offset: 0 }, tx);

    const dup = result.find(s => s.body === "Duplicate suggestion");
    expect(dup).toBeDefined();
    expect(dup?.status).toBe(SuggestionStatus.DUPLICATE);
    expect(dup?.duplicateOfId).toBe(original.id);
    expect(dup?.duplicateOfBody).toBe("Original suggestion");
  });

  suggestionTest("returns empty array for unknown parentId", async tx => {
    const result = await SuggestionRepository.getSuggestionsByParent(
      "00000000-0000-0000-0000-000000000000",
      { limit: 50, offset: 0 },
      tx
    );
    expect(result).toEqual([]);
  });
});

describe("SuggestionRepository — getAdminSuggestionQueue", () => {
  suggestionTest("returns all suggestions with parent names", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "AdminQSug");

    await insertSuggestion(tx, parent.id, {
      submitterName: "AdminQSug Parent",
      body: "Admin queue suggestion",
      status: "REVIEWED",
      reviewedByUserId: null,
      reviewedAt: new Date(),
    });

    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 50, offset: 0 }, tx);

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);

    const matched = result.rows.find(r => r.body === "Admin queue suggestion");
    expect(matched).toBeDefined();
    expect(matched?.parentName).toBe("AdminQSug Parent");
    expect(matched?.submitterName).toBe("AdminQSug Parent");
  });

  suggestionTest("filters by search term on parent name", async tx => {
    const unique = `SrchSug-${randomUUID().slice(0, 8)}`;
    const user = await createTestUser(tx, { name: unique, email: `${unique}@test.com` });
    const parent = await createTestParent(tx, user.id);

    await insertSuggestion(tx, parent.id, { body: "Searchable admin suggestion" });

    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 50, offset: 0, search: unique }, tx);

    expect(result.rows.some(r => r.body === "Searchable admin suggestion")).toBeTrue();
  });

  suggestionTest("filters by PENDING status", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "PendAdm");

    await insertSuggestion(tx, parent.id, { body: "Pending admin", status: "PENDING" });
    await insertSuggestion(tx, parent.id, { body: "Reviewed admin", status: "REVIEWED" });

    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 50, offset: 0, status: "PENDING" }, tx);

    expect(result.rows.every(r => r.status === SuggestionStatus.PENDING)).toBeTrue();
    expect(result.rows.some(r => r.body === "Reviewed admin")).toBeFalse();
  });

  suggestionTest("filters by REVIEWED status", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "RevAdm");

    await insertSuggestion(tx, parent.id, { body: "Pending rev adm", status: "PENDING" });
    await insertSuggestion(tx, parent.id, { body: "Reviewed rev adm", status: "REVIEWED" });

    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 50, offset: 0, status: "REVIEWED" }, tx);

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

    const page1 = await SuggestionRepository.getAdminSuggestionQueue({ limit: 2, offset: 0 }, tx);
    const page2 = await SuggestionRepository.getAdminSuggestionQueue({ limit: 2, offset: 2 }, tx);

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

    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 50, offset: 0 }, tx);

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
    const result = await SuggestionRepository.getSuggestionById("00000000-0000-0000-0000-000000000000", tx);
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
    expect(result?.status).toBe(SuggestionStatus.DUPLICATE);
    expect(result?.duplicateOfId).toBe(original.id);
    expect(result?.duplicateOfBody).toBe("Original for byId");
  });
});

describe("SuggestionRepository — markSuggestionReviewed (Story 15)", () => {
  suggestionTest("sets status to REVIEWED with reviewedByUserId and reviewedAt", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "MarkRev15");

    const suggestion = await insertSuggestion(tx, parent.id, { status: "PENDING" });

    const result = await SuggestionRepository.markSuggestionReviewed(
      { suggestionId: suggestion.id, reviewedByUserId: user.id },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(suggestion.id);
    expect(result.status).toBe(SuggestionStatus.REVIEWED);
    expect(result.reviewedByUserId).toBe(user.id);
    expect(result.reviewedAt).not.toBeNull();
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  suggestionTest("throws for non-existent suggestion ID", async tx => {
    const { user } = await setupParentForSuggestion(tx, "MarkRevNF");

    const error = await expectRepoError(() =>
      SuggestionRepository.markSuggestionReviewed(
        { suggestionId: "00000000-0000-0000-0000-000000000000", reviewedByUserId: user.id },
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
      {
        suggestionId: suggestion.id,
        adminResponse: "Thank you for your feedback",
        reviewedByUserId: user.id,
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(suggestion.id);
    expect(result.adminResponse).toBe("Thank you for your feedback");
    expect(result.status).toBe(SuggestionStatus.REVIEWED);
    expect(result.reviewedByUserId).toBe(user.id);
    expect(result.reviewedAt).not.toBeNull();
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  suggestionTest("throws for non-existent suggestion ID", async tx => {
    const { user } = await setupParentForSuggestion(tx, "RespondNF");

    const error = await expectRepoError(() =>
      SuggestionRepository.respondToSuggestion(
        {
          suggestionId: "00000000-0000-0000-0000-000000000000",
          adminResponse: "Should fail",
          reviewedByUserId: user.id,
        },
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
      {
        suggestionId: suggestion.id,
        adminResponse: "Updated response",
        reviewedByUserId: user.id,
      },
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
      {
        suggestionId: duplicate.id,
        duplicateOfId: original.id,
        reviewedByUserId: user.id,
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(duplicate.id);
    expect(result.status).toBe(SuggestionStatus.DUPLICATE);
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
        {
          suggestionId: "00000000-0000-0000-0000-000000000000",
          duplicateOfId: original.id,
          reviewedByUserId: user.id,
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  suggestionTest("throws for non-existent original suggestion ID (FK violation)", async tx => {
    const { parent, user } = await setupParentForSuggestion(tx, "MarkDupOrig");

    const duplicate = await insertSuggestion(tx, parent.id, { status: "PENDING" });

    const error = await expectRepoError(() =>
      SuggestionRepository.markAsDuplicate(
        {
          suggestionId: duplicate.id,
          duplicateOfId: "00000000-0000-0000-0000-000000000000",
          reviewedByUserId: user.id,
        },
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

    const result = await SuggestionRepository.searchSuggestions(
      "dark mode",
      "00000000-0000-0000-0000-000000000000",
      tx
    );

    expect(result.some(s => s.body === "Add dark mode to the dashboard")).toBeTrue();
    expect(result.some(s => s.body === "Improve scheduling page")).toBeFalse();
  });

  suggestionTest("excludes the suggestion being searched from (self-exclusion)", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SearchSelf");

    const self = await insertSuggestion(tx, parent.id, { body: "Self exclusion test dark mode" });
    await insertSuggestion(tx, parent.id, { body: "Other dark mode suggestion" });

    const result = await SuggestionRepository.searchSuggestions("dark mode", self.id, tx);

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

    const result = await SuggestionRepository.searchSuggestions(
      "dark mode",
      "00000000-0000-0000-0000-000000000000",
      tx
    );

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

    const result = await SuggestionRepository.searchSuggestions(
      "dark mode",
      "00000000-0000-0000-0000-000000000000",
      tx
    );

    expect(result.some(s => s.body === "Duplicate dark mode search")).toBeFalse();
    expect(result.some(s => s.body === "Active dark mode search")).toBeTrue();
  });

  suggestionTest("limits results to 10", async tx => {
    const { parent } = await setupParentForSuggestion(tx, "SearchLimit");

    for (let i = 0; i < 15; i++) {
      await insertSuggestion(tx, parent.id, { body: `Limit test suggestion ${i} with keyword` });
    }

    const result = await SuggestionRepository.searchSuggestions("keyword", "00000000-0000-0000-0000-000000000000", tx);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  suggestionTest("returns empty array for no matches", async tx => {
    const result = await SuggestionRepository.searchSuggestions(
      `nonexistent-${randomUUID().slice(0, 8)}`,
      "00000000-0000-0000-0000-000000000000",
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

    const resultA = await SuggestionRepository.getSuggestionsByParent(parentA.parent.id, { limit: 50, offset: 0 }, tx);

    expect(resultA.some(s => s.body === "Parent B private suggestion")).toBeFalse();
  });

  suggestionTest("Admin can access any suggestion via getAdminSuggestionQueue", async tx => {
    const parentA = await setupParentForSuggestion(tx, "IdorAdminA");
    const parentB = await setupParentForSuggestion(tx, "IdorAdminB");

    await insertSuggestion(tx, parentA.parent.id, { body: "Admin visible A" });
    await insertSuggestion(tx, parentB.parent.id, { body: "Admin visible B" });

    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 50, offset: 0 }, tx);

    expect(result.rows.some(r => r.body === "Admin visible A")).toBeTrue();
    expect(result.rows.some(r => r.body === "Admin visible B")).toBeTrue();
  });
});

describe("SuggestionRepository — non-transactional coverage fallback (Story 15)", () => {
  test("supports getSuggestionsByParent without tx", async () => {
    const result = await SuggestionRepository.getSuggestionsByParent("00000000-0000-0000-0000-000000000000", {
      limit: 1,
      offset: 0,
    });
    expect(result).toEqual([]);
  });

  test("supports getAdminSuggestionQueue without tx", async () => {
    const result = await SuggestionRepository.getAdminSuggestionQueue({ limit: 1, offset: 0 });
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe("number");
  });

  test("supports getSuggestionById without tx", async () => {
    const result = await SuggestionRepository.getSuggestionById("00000000-0000-0000-0000-000000000000");
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
      `nonexistent-${randomUUID().slice(0, 8)}`,
      "00000000-0000-0000-0000-000000000000"
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
        {
          suggestionId: suggestion.id,
          adminResponse: "Should be rolled back",
          reviewedByUserId: user.id,
        },
        tx
      );
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (suggestionId && originalStatus) {
      const [found] = await db.select().from(suggestions).where(eq(suggestions.id, suggestionId)).limit(1);
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

      await SuggestionRepository.markAsDuplicate(
        {
          suggestionId: duplicate.id,
          duplicateOfId: original.id,
          reviewedByUserId: user.id,
        },
        tx
      );
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (duplicateId && originalStatus) {
      const [found] = await db.select().from(suggestions).where(eq(suggestions.id, duplicateId)).limit(1);
      if (found) {
        expect(found.status).toBe(originalStatus);
      }
    }
  });
});
