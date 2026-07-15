import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { LearningResourceRepository } from "@/backend/db/repo";
import { learningResourceFiles, learningResources, storageFiles } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";

function resTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    const result = await runInRollback(fn);
    expect(result).toBeUndefined();
  });
}

async function createTestFile(tx: DBTransaction, path?: string) {
  const files = await tx
    .insert(storageFiles)
    .values({
      path: path ?? `test/resources/${randomUUID()}.pdf`,
      isProtected: true,
    })
    .returning();

  const file = files[0];
  if (!file) throw new Error("Failed to create test file");
  return file;
}

async function createTestResource(
  tx: DBTransaction,
  userId: string,
  displayName: string,
  filePath: string,
  fileId: string
) {
  return await LearningResourceRepository.createResource(
    {
      displayName,
      filePath,
      uploadedByUserId: userId,
      fileId,
    },
    undefined,
    tx
  );
}

async function softDeleteResource(tx: DBTransaction, resourceId: string) {
  await tx.update(learningResources).set({ deletedAt: new Date() }).where(eq(learningResources.id, resourceId));
}

describe("LearningResourceRepository — listResources", () => {
  resTest("returns non-deleted resources ordered by createdAt DESC", async tx => {
    const user = await createTestUser(tx, {
      name: "ListUser",
      email: `list-${randomUUID()}@t.com`,
    });
    const file1 = await createTestFile(tx);
    const file2 = await createTestFile(tx);

    await createTestResource(tx, user.id, "Doc A", "/res/a.pdf", file1.id);
    await createTestResource(tx, user.id, "Doc B", "/res/b.pdf", file2.id);

    const result = await LearningResourceRepository.listResources(null, tx);

    expect(result.rows.length).toBeGreaterThanOrEqual(2);
    expect(result.totalCount).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i]?.createdAt <= result.rows[i - 1]?.createdAt).toBe(true);
    }
  });

  resTest("excludes soft-deleted resources", async tx => {
    const user = await createTestUser(tx, {
      name: "DelUser",
      email: `del-${randomUUID()}@t.com`,
    });
    const file = await createTestFile(tx);
    const resource = await createTestResource(tx, user.id, "Deleted Doc", "/res/del.pdf", file.id);

    const beforeDelete = await LearningResourceRepository.listResources(null, tx);
    const foundBefore = beforeDelete.rows.find(r => r.id === resource.id);
    expect(foundBefore).toBeDefined();

    await softDeleteResource(tx, resource.id);

    const afterDelete = await LearningResourceRepository.listResources(null, tx);
    const foundAfter = afterDelete.rows.find(r => r.id === resource.id);
    expect(foundAfter).toBeUndefined();
  });

  resTest("returns correct totalCount", async tx => {
    const result = await LearningResourceRepository.listResources(null, tx);
    expect(typeof result.totalCount).toBe("number");
    expect(result.totalCount).toBe(result.rows.length);
  });

  resTest("returns empty result when no resources exist", async tx => {
    const result = await LearningResourceRepository.listResources(null, tx);
    expect(Array.isArray(result.rows)).toBe(true);
  });
});

describe("LearningResourceRepository — createResource", () => {
  resTest("creates resource and file association atomically", async tx => {
    const user = await createTestUser(tx, {
      name: "CreateUser",
      email: `create-${randomUUID()}@t.com`,
    });
    const file = await createTestFile(tx);

    const resource = await LearningResourceRepository.createResource(
      {
        displayName: "Test PDF Document",
        filePath: "/resources/test-document.pdf",
        uploadedByUserId: user.id,
        fileId: file.id,
      },
      undefined,
      tx
    );

    expect(resource.id).toBeDefined();
    expect(resource.displayName).toBe("Test PDF Document");
    expect(resource.filePath).toBe("/resources/test-document.pdf");
    expect(resource.uploadedByUserId).toBe(user.id);
    expect(resource.uploadedByUserName).toBeNull();
    expect(resource.fileSize).toBeNull();
    expect(resource.contentType).toBeNull();

    const [fileLink] = await tx
      .select()
      .from(learningResourceFiles)
      .where(eq(learningResourceFiles.learningResourceId, resource.id));
    expect(fileLink).toBeDefined();
    expect(fileLink?.fileId).toBe(file.id);
    expect(fileLink?.usageType).toBe("document");
  });

  resTest("newly created resource appears in listResources", async tx => {
    const user = await createTestUser(tx, {
      name: "ListAfterCreate",
      email: `lac-${randomUUID()}@t.com`,
    });
    const file = await createTestFile(tx);

    const resource = await createTestResource(tx, user.id, "Listed After Create", "/res/lac.pdf", file.id);

    const result = await LearningResourceRepository.listResources(null, tx);
    const found = result.rows.find(r => r.id === resource.id);
    expect(found).toBeDefined();
    expect(found?.displayName).toBe("Listed After Create");
  });

  resTest("creates multiple resources independently", async tx => {
    const user = await createTestUser(tx, {
      name: "MultiResUser",
      email: `multi-${randomUUID()}@t.com`,
    });
    const file1 = await createTestFile(tx);
    const file2 = await createTestFile(tx);

    const r1 = await createTestResource(tx, user.id, "Res One", "/res/one.pdf", file1.id);
    const r2 = await createTestResource(tx, user.id, "Res Two", "/res/two.pdf", file2.id);

    expect(r1.id).not.toBe(r2.id);
    expect(r1.displayName).toBe("Res One");
    expect(r2.displayName).toBe("Res Two");
  });
});

describe("LearningResourceRepository — findById", () => {
  resTest("returns existing non-deleted resource", async tx => {
    const user = await createTestUser(tx, {
      name: "FindByIdUser",
      email: `find-${randomUUID()}@t.com`,
    });
    const file = await createTestFile(tx);
    const created = await createTestResource(tx, user.id, "Find Me", "/res/find.pdf", file.id);

    const found = await LearningResourceRepository.findById(created.id, tx);
    expect(found).not.toBeNull();
    expect(found?.displayName).toBe("Find Me");
    expect(found?.filePath).toBe("/res/find.pdf");
    expect(found?.uploadedByUserId).toBe(user.id);
  });

  resTest("returns null for non-existent resource ID", async tx => {
    const result = await LearningResourceRepository.findById("00000000-0000-0000-0000-000000000000", tx);
    expect(result).toBeNull();
  });

  resTest("returns null for soft-deleted resource", async tx => {
    const user = await createTestUser(tx, {
      name: "SoftDelFindUser",
      email: `sdf-${randomUUID()}@t.com`,
    });
    const file = await createTestFile(tx);
    const created = await createTestResource(tx, user.id, "Soft Deleted", "/res/sd.pdf", file.id);

    await softDeleteResource(tx, created.id);

    const found = await LearningResourceRepository.findById(created.id, tx);
    expect(found).toBeNull();
  });
});

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

describe("LearningResourceRepository — deleteResource", () => {
  resTest("successfully hard deletes an existing learning resource", async tx => {
    const user = await createTestUser(tx, {
      name: "DeleteUser",
      email: `delete-${randomUUID()}@t.com`,
    });
    const file = await createTestFile(tx);
    const resource = await createTestResource(tx, user.id, "Delete Doc", "/res/delete.pdf", file.id);

    // Verify it exists in DB
    const foundBefore = await LearningResourceRepository.findById(resource.id, tx);
    expect(foundBefore).not.toBeNull();

    // Act
    const result = await LearningResourceRepository.deleteResource(resource.id, undefined, tx);

    // Assert
    expect(result).toBe(true);

    // Verify it's gone
    const foundAfter = await LearningResourceRepository.findById(resource.id, tx);
    expect(foundAfter).toBeNull();
  });

  resTest("throws an error when resource ID does not exist", async tx => {
    const nonExistentId = randomUUID();

    const error = await expectRepoError(async () => {
      await LearningResourceRepository.deleteResource(nonExistentId, undefined, tx);
    });

    expect(error.message).toContain("غير موجود");
  });
});
