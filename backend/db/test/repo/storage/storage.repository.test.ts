import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { storageFiles, userFiles } from "@/backend/db/schema";
import { createTestParent, createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";

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

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (errorCaught instanceof Error) return errorCaught;
  throw new Error(String(errorCaught));
}

function testPublicPathBlocked(name: string, logic: (tx: DBTransaction) => Promise<unknown>) {
  test(name, async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() => logic(tx));
      expect(error.message).toContain("Forbidden");
    });
  });
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

describe("StorageDbRepository — public-path guard on domain junction writers", () => {
  testPublicPathBlocked("blocks linkFileToInvoice when the file lives under public/", async tx => {
    const file = await createTestFile(tx, "public/avatars/leak.png");
    await StorageDbRepository.linkFileToInvoice(`invoice-${randomUUID()}`, file.id, "PAYMENT_PROOF", tx);
  });

  testPublicPathBlocked("blocks linkFileToInvoice for the bare public path", async tx => {
    const file = await createTestFile(tx, "public");
    await StorageDbRepository.linkFileToInvoice(`invoice-${randomUUID()}`, file.id, "PAYMENT_PROOF", tx);
  });

  testPublicPathBlocked(
    "blocks performJunctionInsert into complaintFiles when the file lives under public/",
    async tx => {
      const file = await createTestFile(tx, "public/complaints/leak.png");
      await StorageDbRepository.performJunctionInsert(
        { table: "complaints", fileId: file.id, refId: randomUUID(), type: "ATTACHMENT", createdAt: new Date() },
        undefined,
        tx
      );
    }
  );

  test("allows public paths on non-domain junction tables", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, {
        name: "Public Avatar User",
        email: `pub-avatar-${randomUUID()}@test.com`,
      });
      const file = await createTestFile(tx, `public/avatars/${randomUUID()}.png`);

      await StorageDbRepository.performJunctionInsert(
        { table: "users", fileId: file.id, refId: user.id, type: "avatar", createdAt: new Date() },
        undefined,
        tx
      );
      const [usage] = await tx.select().from(userFiles).where(eq(userFiles.fileId, file.id));
      expect(usage).toBeDefined();

      const parent = await createTestParent(tx, user.id);
      const link = await StorageDbRepository.linkFileToParent(parent.id, file.id, "avatar", tx);
      expect(link.parentId).toBe(parent.id);
    });
  });
});
