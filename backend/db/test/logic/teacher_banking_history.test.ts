import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { TeacherBankingRepository } from "@/backend/db/repo/teachers/teacher-banking.repository";
import { teacherBankingDetailsHistory } from "@/backend/db/schema";
import type { TeacherBankingDetailsHistorySelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { setupTeacher } from "../entity-setup";
import { createTestUser, runInRollback } from "../test-utils";

type DBTransaction = NonNullable<Parameters<typeof TeacherBankingRepository.submitBankingDetails>[1]>;

/**
 * Shared setup for banking tests to reduce duplication
 */
async function setupBankingTest(tx: DBTransaction, prefix: string, beneficiaryName = "Original Name") {
  const { teacher } = await setupTeacher(tx, {
    name: `${prefix} Teacher`,
    email: `tea-${prefix.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 8)}@example.com`,
  });

  const banking = await TeacherBankingRepository.submitBankingDetails(
    {
      teacherId: teacher.id,
      beneficiaryName,
      bankName: "Test Bank",
    },
    tx
  );

  return { teacher, banking };
}

describe("Teacher Banking Details Versioning & History", () => {
  const expectBankingUpdateToFail = async (
    tx: DBTransaction,
    bankingId: string,
    update: Partial<import("../../../types").TeacherBankingDetailsHistoryInsertInput>
  ): Promise<Error> => {
    let errorCaught: unknown = null;
    try {
      await TeacherBankingRepository.updateBankingDetails(bankingId, update, tx);
    } catch (error) {
      errorCaught = error;
    }
    expect(errorCaught).not.toBeNull();
    return errorCaught as Error;
  };

  test("Allows historical record updates by closing old and inserting new", async () => {
    testLogger.info("Testing manual versioning flow...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx, {
        name: "Bank Teacher",
        email: `teacher-bank-${randomUUID()}@example.com`,
      });

      const banking1 = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Original Name",
          bankName: "First Bank",
          accountNumber: "111111",
        },
        tx
      );

      await new Promise(resolve => setTimeout(resolve, 50));

      const banking2 = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Original Name",
          bankName: "Second Bank",
          accountNumber: "111111",
        },
        tx
      );

      const dbRows = (await tx
        .select()
        .from(teacherBankingDetailsHistory)
        .where(eq(teacherBankingDetailsHistory.teacherId, teacher.id))) as TeacherBankingDetailsHistorySelectType[];

      expect(dbRows).toHaveLength(2);

      const oldRecord = dbRows.find(r => r.id === banking1.id);
      const newRecord = dbRows.find(r => r.id === banking2.id);

      expect(oldRecord).toBeDefined();
      expect(newRecord).toBeDefined();

      if (oldRecord && newRecord) {
        expect(oldRecord.validUntil).not.toBeNull();
        expect(oldRecord.bankName).toBe("First Bank");

        expect(newRecord.validUntil).toBeNull();
        expect(newRecord.bankName).toBe("Second Bank");
        expect(newRecord.validFrom).not.toBeNull();
      }
    });
    testLogger.info("Manual versioning flow test passed.");
  });

  test("Prevents direct updates to historically closed records", async () => {
    testLogger.info("Testing historical closed record immutability...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx, {
        name: "Closed Bank Teacher",
        email: `teacher-bank-closed-${randomUUID()}@example.com`,
      });

      const now = new Date();
      const [banking] = (await tx
        .insert(teacherBankingDetailsHistory)
        .values({
          teacherId: teacher.id,
          beneficiaryName: "Original Name",
          bankName: "First Bank",
          validUntil: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherBankingDetailsHistorySelectType];

      const error = await expectBankingUpdateToFail(tx, banking.id, { beneficiaryName: "Cheater Name" });
      expect(error.message).toContain("Cannot modify historical banking records");
    });
    testLogger.info("Historical closed record immutability test passed.");
  });

  test("Prevents direct updates to banking fields of active records", async () => {
    testLogger.info("Testing active record banking fields immutability...");
    await runInRollback(async tx => {
      const { banking } = await setupBankingTest(tx, "Active Bank", "Original Name");

      const error = await expectBankingUpdateToFail(tx, banking.id, { beneficiaryName: "Cheater Name" });
      expect(error.message).toContain("Cannot modify banking fields directly");
    });
    testLogger.info("Active record banking fields immutability test passed.");
  });

  test("Allows updating non-banking fields without creating a new historical version", async () => {
    testLogger.info("Testing non-banking fields updates...");
    await runInRollback(async tx => {
      const { teacher, banking } = await setupBankingTest(tx, "Bank Noop", "Constant Name");

      await TeacherBankingRepository.updateNonBankingFields(banking.id, { updatedAt: new Date() }, tx);

      const dbRows = (await tx
        .select()
        .from(teacherBankingDetailsHistory)
        .where(eq(teacherBankingDetailsHistory.teacherId, teacher.id))) as TeacherBankingDetailsHistorySelectType[];

      expect(dbRows).toHaveLength(1);
    });
    testLogger.info("Non-banking fields updates test passed.");
  });

  test("Verified records cannot be un-verified or modified", async () => {
    testLogger.info("Testing verified record immutability...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx, {
        name: "Verified Bank Teacher",
        email: `teacher-bank-verified-${randomUUID()}@example.com`,
      });

      const admin = await createTestUser(tx, { name: "Admin", email: `admin-${randomUUID()}@example.com` });

      const banking = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Verified Name",
          bankName: "Safe Bank",
        },
        tx
      );

      // Verify it
      await TeacherBankingRepository.verifyBankingDetails(
        {
          bankingDetailsId: banking.id,
        },
        tx,
        undefined,
        admin.id
      );

      // Attempt to modify a banking field
      const modifyError = await expectBankingUpdateToFail(tx, banking.id, { bankName: "Hack Bank" });
      expect(modifyError.message).toContain("Cannot modify verified banking records");

      // Attempt to un-verify
      const unverifyError = await expectBankingUpdateToFail(tx, banking.id, { verifiedAt: null });
      expect(unverifyError.message).toContain("Cannot modify verified banking records");
    });
    testLogger.info("Verified record immutability test passed.");
  });
});
