import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { CreditRepository } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { students } from "@/backend/db/schema";
import { setupStudent, setupTestEntities } from "@/backend/db/test/entity-setup";
import { expectSavepointError, runInRollback } from "@/backend/db/test/test-utils";
import type { ClassInstanceSelectType } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

function requireInstance(instance: ClassInstanceSelectType | null): ClassInstanceSelectType {
  if (!instance) {
    throw new Error("setupTestEntities returned a null instance — pass skipInstance:false");
  }
  return instance;
}

async function hourBalanceOf(tx: Parameters<typeof CreditRepository.getHourBalance>[0], studentId: string) {
  return CreditRepository.getHourBalance(tx, studentId);
}

describe("Credit hours workflow — purchase, deduct, refund, parallel ledger", () => {
  test("hour purchase bumps students.creditHoursTotal/Remaining atomically and appends a PURCHASE hour row", async () => {
    await runInRollback(async tx => {
      const { student, user } = await setupStudent(tx);
      const key = `hours-purchase-${randomUUID()}`;

      await CreditRepository.createHourPurchase(tx, {
        studentId: student.id,
        hours: 12,
        creditedByUserId: user.id,
        idempotencyKey: key,
        notes: "hour pack",
      });
      // Balance bump is the service-level counterpart (SQL expression increment).
      await StudentRepository.addCreditHours(student.id, tErrors, 12, undefined, tx);

      const balance = await hourBalanceOf(tx, student.id);
      expect(Number(balance.creditHoursTotal)).toBe(12);
      expect(Number(balance.creditHoursRemaining)).toBe(12);

      const [row] = await CreditRepository.findByIdempotencyKeys([key], tx);
      expect(Number(row?.changeAmountHours ?? "0")).toBe(12);
      expect(row?.changeAmount).toBeNull();
    });
  });

  test("deducting more than the remaining balance raises the typed insufficient-hours error and leaves balance intact", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      await StudentRepository.addCreditHours(student.id, tErrors, 3, undefined, tx);

      const expectedMessage = tErrors.credit.insufficientHours({
        studentId: student.id,
        remaining: 3,
        required: 5,
      });
      const error = await expectSavepointError(
        () => StudentRepository.deductCreditHours(student.id, tErrors, 5, undefined, tx),
        tx
      );
      expect(error.message).toBe(expectedMessage);

      // Savepoint rolled back the failed attempt — balance must be untouched.
      const balance = await hourBalanceOf(tx, student.id);
      expect(Number(balance.creditHoursRemaining)).toBe(3);
    });
  });

  test("refundHoursOnCancel is keyed-idempotent: replaying the same idempotency key inserts no duplicate", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "HourRefundFlow", {});
      const instance = requireInstance(entities.instance);
      const { student } = await setupStudent(tx);
      const creditedByUserId = entities.parentUser.id;

      const key = `hours-refund-${randomUUID()}`;
      const first = await CreditRepository.refundHoursOnCancel(tx, {
        studentId: student.id,
        classInstanceId: instance.id,
        hours: 1.5,
        creditedByUserId,
        idempotencyKey: key,
      });
      expect(Number(first.changeAmountHours ?? "0")).toBe(1.5);

      const rowsWithKey = await CreditRepository.findByIdempotencyKeys([key], tx);
      expect(rowsWithKey).toHaveLength(1);

      // Replay must hit the unique contract instead of silently duplicating.
      await expectSavepointError(
        () =>
          CreditRepository.refundHoursOnCancel(tx, {
            studentId: student.id,
            classInstanceId: instance.id,
            hours: 1.5,
            creditedByUserId,
            idempotencyKey: key,
          }),
        tx
      );

      expect(await CreditRepository.findByIdempotencyKeys([key], tx)).toHaveLength(1);
    });
  });

  test("class ledger and hour ledger coexist under the XOR constraint and hoursOnly listings isolate hour rows", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "XorLedgers", { classesRemaining: 4 });
      const instance = requireInstance(entities.instance);
      const studentId = entities.student.id;
      const creditedByUserId = entities.parentUser.id;

      // One class-based row (changeAmount set) …
      const classRow = await CreditRepository.createPurchase(tx, {
        studentId,
        changeAmount: 5,
        creditedByUserId,
        idempotencyKey: `xor-class-${randomUUID()}`,
      });
      // … and one hour-based row (changeAmountHours set) — both must persist.
      const hourRow = await CreditRepository.createHourPurchase(tx, {
        studentId,
        hours: 7,
        creditedByUserId,
        idempotencyKey: `xor-hour-${randomUUID()}`,
      });

      expect(classRow.changeAmount).toBe(5);
      expect(classRow.changeAmountHours).toBeNull();
      expect(hourRow.changeAmount).toBeNull();
      expect(Number(hourRow.changeAmountHours ?? "0")).toBe(7);

      // The booking variant of the hour ledger works against the same student…
      const bookingRow = await CreditRepository.deductHoursForBooking(tx, {
        studentId,
        classInstanceId: instance.id,
        hours: 2,
        creditedByUserId,
        idempotencyKey: `xor-booking-${randomUUID()}`,
      });
      expect(Number(bookingRow.changeAmountHours ?? "0")).toBe(-2);

      const hourRows = await CreditRepository.getTransactions(tx, studentId, null, { hoursOnly: true });
      const hourIds = new Set(hourRows.map(r => r.id));
      expect(hourIds.has(hourRow.id)).toBe(true);
      expect(hourIds.has(bookingRow.id)).toBe(true);
      expect(hourIds.has(classRow.id)).toBe(false);

      expect(await CreditRepository.countTransactions(tx, studentId, { hoursOnly: true })).toBe(2);
    });
  });

  test("deductHoursForBooking rejects zero-hour bookings and accepts fractional durations", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "ZeroHours", {});
      const instance = requireInstance(entities.instance);
      const { student, user } = await setupStudent(tx);

      // Zero / negative durations are invalid input, not silent no-op rows.
      const zeroError = await expectSavepointError(
        () =>
          CreditRepository.deductHoursForBooking(tx, {
            studentId: student.id,
            classInstanceId: instance.id,
            hours: 0,
            creditedByUserId: user.id,
            idempotencyKey: `zero-hours-${randomUUID()}`,
          }),
        tx
      );
      expect(zeroError.message).toContain("positive, non-zero hours");

      // Fractional bookings succeed once the student owns enough hours.
      await StudentRepository.addCreditHours(student.id, tErrors, 2, undefined, tx);
      const deducted = await CreditRepository.deductHoursForBooking(tx, {
        studentId: student.id,
        classInstanceId: instance.id,
        hours: 0.5,
        creditedByUserId: user.id,
        idempotencyKey: `fractional-${randomUUID()}`,
      });
      expect(Number(deducted.changeAmountHours ?? "0")).toBe(-0.5);

      await StudentRepository.deductCreditHours(student.id, tErrors, 0.5, undefined, tx);
      const [after] = await tx.select().from(students).where(eq(students.id, student.id)).limit(1);
      expect(Number(after?.creditHoursRemaining ?? "0")).toBeCloseTo(1.5, 6);
    });
  });
});
