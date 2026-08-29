import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { creditTransactions, parents, students, users } from "@/backend/db/schema";
import {
  createTestParent,
  createTestStudent,
  createTestUser,
  ensureTestSubjectId,
  setupStudent,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CreditService } from "@/backend/services/billing/credit.service";
import type { DBTransaction } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

/**
 * Validation guards in the hour methods throw BEFORE touching the database, so
 * a plain try/catch helper is safe inside `runInRollback` (no tx poisoning).
 */
async function catchError(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    return error instanceof Error ? error : new Error("Unexpected rejection shape");
  }
  throw new Error("expected the wrapped service call to throw");
}

/**
 * Inserts a bare class_instances row via explicit columns so the ledger FK is
 * satisfiable without depending on every optional/payroll column of the table.
 * Raw SQL sidesteps drizzle's schema-wide RETURNING list, which may reference
 * columns pending migration in the shared test database.
 */
async function insertBareClassInstance(tx: DBTransaction, studentId: string, teacherId: string): Promise<string> {
  const id = randomUUID();
  const now = new Date();
  const start = new Date(now.getTime() + 3_600_000);
  const end = new Date(start.getTime() + 3_600_000);
  const subjectId = await ensureTestSubjectId(tx);
  await tx.execute(sql`
    insert into class_instances (
      id, student_id, teacher_id, subject_id,
      scheduled_start_at, scheduled_end_at, duration_minutes,
      class_type, idempotency_key, created_at, updated_at
    ) values (
      ${id}, ${studentId}, ${teacherId}, ${subjectId},
      ${start}, ${end}, ${60},
      ${"REGULAR"}, ${`bare-${randomUUID()}`}, ${now}, ${now}
    )
  `);
  return id;
}

/**
 * CreditService hour methods (`recordHourPurchase` / `deductHoursForBooking` /
 * `refundHoursOnCancel`) run inside a CALLER-owned transaction, so they are
 * exercised directly under `runInRollback`. `getStudentHourBalance` resolves
 * actor state with bare reads, so its fixtures are committed + hard-deleted.
 */
describe("CreditService hour methods (caller-owned tx)", () => {
  test("recordHourPurchase writes the hour ledger row, bumps the balance, and replays safely", async () => {
    await runInRollback(async tx => {
      const { student, user } = await setupStudent(tx);
      const key = `svc-hour-purchase-${randomUUID()}`;
      const input = { studentId: student.id, hours: 3.5, creditedByUserId: user.id };

      const first = await CreditService.recordHourPurchase(input, key, tx, tErrors);
      expect(first).not.toBeNull();
      expect(Number(first?.changeAmountHours ?? "0")).toBe(3.5);

      // Same idempotency key returns the persisted row instead of re-crediting.
      const replay = await CreditService.recordHourPurchase(input, key, tx, tErrors);
      expect(replay?.id).toBe(first?.id);

      const rows = await tx.select().from(creditTransactions).where(eq(creditTransactions.studentId, student.id));
      expect(rows).toHaveLength(1);

      const facets = await tx.select().from(students).where(eq(students.id, student.id));
      expect(Number(facets[0]?.creditHoursRemaining ?? "0")).toBe(3.5);
      expect(Number(facets[0]?.creditHoursTotal ?? "0")).toBe(3.5);
    });
  });

  test("recordHourPurchase rejects zero / negative / non-finite hours", async () => {
    await runInRollback(async tx => {
      const { student, user } = await setupStudent(tx);
      const attempt = (hours: number) =>
        catchError(() =>
          CreditService.recordHourPurchase(
            { studentId: student.id, hours, creditedByUserId: user.id },
            `bad-hours-${randomUUID()}`,
            tx,
            tErrors
          )
        );

      const zeroError = await attempt(0);
      const negativeError = await attempt(-1);
      const nanError = await attempt(Number.NaN);

      expect(zeroError.message).toBe(tErrors.credit.invalidInput);
      expect(negativeError.message).toBe(tErrors.credit.invalidInput);
      expect(nanError.message).toBe(tErrors.credit.invalidInput);
    });
  });

  test("deductHoursForBooking rejects non-positive input and ignores derived-key replays", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "SvcDeduct", { skipInstance: true });
      const studentId = entities.student.id;
      const creditedByUserId = entities.parentUser.id;
      const instanceId = await insertBareClassInstance(tx, studentId, entities.teacher.id);

      const zeroError = await catchError(() =>
        CreditService.deductHoursForBooking(
          studentId,
          instanceId,
          0,
          creditedByUserId,
          `svc-zero-${randomUUID()}`,
          tx,
          tErrors
        )
      );
      expect(zeroError.message).toBe(tErrors.credit.invalidInput);

      await StudentRepository.addCreditHours(studentId, tErrors, 4, undefined, tx);

      await CreditService.deductHoursForBooking(
        studentId,
        instanceId,
        1.5,
        creditedByUserId,
        `svc-deduct-${randomUUID()}`,
        tx,
        tErrors
      );
      // Same student+classInstance+operation derives the same ledger key: a second
      // call with a FRESH caller key is a silent no-op (idempotent booking op).
      await CreditService.deductHoursForBooking(
        studentId,
        instanceId,
        1.5,
        creditedByUserId,
        `svc-deduct-replay-${randomUUID()}`,
        tx,
        tErrors
      );

      const rows = await CreditRepository.getTransactions(tx, studentId, null, { hoursOnly: true });
      expect(rows).toHaveLength(1);
      expect(Number(rows[0]?.changeAmountHours ?? "0")).toBe(-1.5);

      const facets = await tx.select().from(students).where(eq(students.id, studentId));
      expect(Number(facets[0]?.creditHoursRemaining ?? "0")).toBe(2.5);
    });
  });

  test("refundHoursOnCancel restores hours and ignores derived-key replays", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "SvcRefund", { skipInstance: true });
      const studentId = entities.student.id;
      const creditedByUserId = entities.parentUser.id;
      const instanceId = await insertBareClassInstance(tx, studentId, entities.teacher.id);

      await CreditService.refundHoursOnCancel(
        studentId,
        instanceId,
        2,
        creditedByUserId,
        `svc-refund-${randomUUID()}`,
        tx,
        tErrors
      );
      await CreditService.refundHoursOnCancel(
        studentId,
        instanceId,
        2,
        creditedByUserId,
        `svc-refund-replay-${randomUUID()}`,
        tx,
        tErrors
      );

      const rows = await CreditRepository.getTransactions(tx, studentId, null, { hoursOnly: true });
      expect(rows).toHaveLength(1);
      expect(Number(rows[0]?.changeAmountHours ?? "0")).toBe(2);

      const facets = await tx.select().from(students).where(eq(students.id, studentId));
      expect(Number(facets[0]?.creditHoursRemaining ?? "0")).toBe(2);
    });
  });
});

describe("CreditService.getStudentHourBalance (committed fixtures)", () => {
  let adminUserId = "";
  let parentUserId = "";
  let parentRowId = "";
  let studentLoginId = "";
  let studentRowId = "";
  let unrelatedUserId = "";

  beforeAll(async () => {
    await db.transaction(async tx => {
      const admin = await createTestUser(tx, { isSuperAdmin: true });
      const parentUser = await createTestUser(tx);
      const studentLogin = await createTestUser(tx);
      const parentRow = await createTestParent(tx, parentUser.id);
      const studentRow = await createTestStudent(tx, parentRow.id, { userId: studentLogin.id });
      const unrelated = await createTestUser(tx);

      adminUserId = admin.id;
      parentUserId = parentUser.id;
      parentRowId = parentRow.id;
      studentLoginId = studentLogin.id;
      studentRowId = studentRow.id;
      unrelatedUserId = unrelated.id;
    });
  });

  afterAll(async () => {
    if (!studentRowId) return;
    await db.transaction(async tx => {
      await tx.delete(students).where(eq(students.id, studentRowId));
      await tx.delete(parents).where(eq(parents.id, parentRowId));
      await tx.delete(users).where(inArray(users.id, [adminUserId, parentUserId, studentLoginId, unrelatedUserId]));
    });
  });

  test("super admin, the student's own login and the linked parent can read the hour balance", async () => {
    const viaAdmin = await CreditService.getStudentHourBalance(adminUserId, studentRowId, tErrors);
    expect(viaAdmin.studentId).toBe(studentRowId);

    const viaStudent = await CreditService.getStudentHourBalance(studentLoginId, studentRowId, tErrors);
    expect(viaStudent.studentId).toBe(studentRowId);

    const viaParent = await CreditService.getStudentHourBalance(parentUserId, studentRowId, tErrors);
    expect(viaParent.studentId).toBe(studentRowId);
  });

  test("an unrelated caller is denied (IDOR) and an unknown student is not found", async () => {
    const denied = await catchError(() => CreditService.getStudentHourBalance(unrelatedUserId, studentRowId, tErrors));
    expect(denied.message).toBe(tErrors.insufficientPermissions);

    const notFound = await catchError(() => CreditService.getStudentHourBalance(adminUserId, randomUUID(), tErrors));
    expect(notFound.message).toContain("not found");
  });
});
