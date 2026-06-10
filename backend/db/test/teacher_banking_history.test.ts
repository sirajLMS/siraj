import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type { TeacherBankingDetailsHistorySelectType, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { TeacherBankingRepository } from "../repo/teacher-banking.repository";
import { teacherBankingDetailsHistory, teachers, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("Teacher Banking Details Versioning & History", () => {
  test("Allows historical record updates by closing old and inserting new", async () => {
    testLogger.info("Testing manual versioning flow...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `teacher-bank-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({
          name: "Bank Teacher",
          email,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: user.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

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

      expect(dbRows.length).toBe(2);

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
      const now = new Date();
      const email = `teacher-bank-closed-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({
          name: "Closed Bank Teacher",
          email,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: user.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

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

      try {
        await TeacherBankingRepository.updateBankingDetails(banking.id, { beneficiaryName: "Cheater Name" }, tx);
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain("Cannot modify historical banking records");
      }
    });
    testLogger.info("Historical closed record immutability test passed.");
  });

  test("Prevents direct updates to banking fields of active records", async () => {
    testLogger.info("Testing active record banking fields immutability...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `teacher-bank-active-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({
          name: "Active Bank Teacher",
          email,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: user.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const banking = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Original Name",
          bankName: "First Bank",
        },
        tx
      );

      try {
        await TeacherBankingRepository.updateBankingDetails(banking.id, { beneficiaryName: "Cheater Name" }, tx);
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain("Cannot modify banking fields directly");
      }
    });
    testLogger.info("Active record banking fields immutability test passed.");
  });

  test("Allows updating non-banking fields without creating a new historical version", async () => {
    testLogger.info("Testing non-banking fields updates...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `teacher-bank-noop-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({
          name: "Bank Teacher Noop",
          email,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: user.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const banking = await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId: teacher.id,
          beneficiaryName: "Constant Name",
          bankName: "Constant Bank",
        },
        tx
      );

      await TeacherBankingRepository.updateNonBankingFields(banking.id, { updatedAt: new Date() }, tx);

      const dbRows = (await tx
        .select()
        .from(teacherBankingDetailsHistory)
        .where(eq(teacherBankingDetailsHistory.teacherId, teacher.id))) as TeacherBankingDetailsHistorySelectType[];

      expect(dbRows.length).toBe(1);
      expect(dbRows[0].validUntil).toBeNull();
    });
    testLogger.info("Non-banking fields update test passed.");
  });

  test("Enforces at most one active record per teacher via partial unique index", async () => {
    testLogger.info("Testing partial unique constraint on active records...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `teacher-bank-uniq-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({
          name: "Bank Teacher Unique",
          email,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: user.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      await tx
        .insert(teacherBankingDetailsHistory)
        .values({
          teacherId: teacher.id,
          beneficiaryName: "Active 1",
          createdAt: now,
          updatedAt: now,
        })
        .execute();

      try {
        await tx
          .insert(teacherBankingDetailsHistory)
          .values({
            teacherId: teacher.id,
            beneficiaryName: "Active 2",
            createdAt: now,
            updatedAt: now,
          })
          .execute();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("teacher_banking_details_history_active_idx");
      }
    });
    testLogger.info("Partial unique constraint test passed.");
  });
});
