import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { StorageDbRepository } from "@/backend/db/repo";
import { storageFiles } from "@/backend/db/schema";
import { createTestParent, createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";

async function createTestFile(tx: DBTransaction, path?: string) {
  const [file] = await tx
    .insert(storageFiles)
    .values({
      path: path ?? `test/path/${randomUUID()}.pdf`,
      isProtected: true,
    })
    .returning();
  return file;
}

describe("StorageDbRepository — getFilesForParent & linkFileToParent", () => {
  test("successfully links a file and retrieves it for a parent", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "File Parent", email: `fp-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);
      const file = await createTestFile(tx);

      const link = await StorageDbRepository.linkFileToParent(parent.id, file.id, "CONTRACT", tx);
      expect(link.parentId).toBe(parent.id);
      expect(link.fileId).toBe(file.id);
      expect(link.usageType).toBe("CONTRACT");

      const files = await StorageDbRepository.getFilesForParent(parent.id, tx);
      expect(files).toHaveLength(1);
      expect(files[0].fileId).toBe(file.id);
      expect(files[0].usageType).toBe("CONTRACT");
      expect(files[0].filePath).toBe(file.path);
    });
  });

  test("returns multiple files in descending order of creation", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Multi File Parent", email: `mfp-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);

      const file1 = await createTestFile(tx, "path1.pdf");
      const file2 = await createTestFile(tx, "path2.pdf");

      const now = new Date();
      const past = new Date(now.getTime() - 10000); // 10 seconds in the past

      await StorageDbRepository.linkFileToParent(parent.id, file1.id, "DOC1", tx, past);
      await StorageDbRepository.linkFileToParent(parent.id, file2.id, "DOC2", tx, now);

      const files = await StorageDbRepository.getFilesForParent(parent.id, tx);
      expect(files).toHaveLength(2);
      // Descending order by createdAt — most recent first
      expect(files[0].usageType).toBe("DOC2");
      expect(files[1].usageType).toBe("DOC1");
    });
  });

  test("returns empty array for parent with no files", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "No File Parent", email: `nfp-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);

      const result = await StorageDbRepository.getFilesForParent(parent.id, tx);
      expect(result).toEqual([]);
    });
  });

  test("returns empty array for unknown parentId", async () => {
    await runInRollback(async tx => {
      const result = await StorageDbRepository.getFilesForParent("00000000-0000-0000-0000-000000000000", tx);
      expect(result).toEqual([]);
    });
  });
});
