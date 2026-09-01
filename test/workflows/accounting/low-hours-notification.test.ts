import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, creditTransactions, students, teachers, users } from "@/backend/db/schema";
import { createMockClassInstance, createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { CreditReason, NotificationEventType, PaymentGateway } from "@/backend/enum";
import { ConflictError } from "@/backend/lib";
import { AccountingPaymentService, CreditService } from "@/backend/services/billing";
import { AccountingNotificationService } from "@/backend/services/billing/accounting-notification.service";
import { resolveLowHoursThreshold } from "@/backend/services/billing/accounting-settings.utils";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type {
  AccountingPaymentSubmitInput,
  ClassInstanceSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type AccountingJourneyCast,
  cleanupAccountingJourneyCast,
  dispatchTargetsForEvent,
  expectJourneyError,
  provisionAccountingJourneyCast,
  waitForEventDispatchToUser,
} from "@/test/workflows/helpers";

/**
 * Cross-actor journey: hour deductions at the service level push a funded
 * account below the `accounting_low_hours_threshold` system setting and the
 * ACCOUNTING_LOW_HOURS alert reaches the student and the linked parent.
 *
 * v1 wiring reality (Phase 12): `CreditService.deductHoursForBooking` is a
 * caller-owned-tx primitive with NO booking-side producer yet (Plan 6 wires
 * the booking path). The low-balance probe is
 * `AccountingNotificationService.maybeNotifyLowHours`, delivered to the
 * student + linked parent only — admin fan-out was deferred, so this journey
 * asserts student+parent and explicitly verifies that admins are NOT targets.
 * The journey therefore drives the deduction inside a committed
 * `db.transaction` and then invokes the wiring entry point, mirroring how a
 * future booking producer must call it post-commit.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): fixtures are committed in beforeAll and
 * hard-deleted in afterAll.
 */
describe("Hour deduction → low-hours notification journey (student + parent)", () => {
  const PREFIX = `jrn_lowhr_${randomUUID().slice(0, 8)}`;
  const PURCHASE_HOURS = 10;

  let tErrors: ErrorsLabels;
  let cast: AccountingJourneyCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let teacherUser: UserSelectType;
  let teacher: TeacherSelectType;
  let instanceAbove: ClassInstanceSelectType;
  let instanceBelow: ClassInstanceSelectType;
  let threshold: number;
  // Deducting `aboveThresholdDeduct` from a full balance lands at threshold+1;
  // deducting `BELOW_THRESHOLD_DEDUCT` next lands at threshold-1.
  let aboveThresholdDeduct: number;
  const BELOW_THRESHOLD_DEDUCT = 2;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for ALL notification dispatch. spyOn on the module
    // namespace is asserted empirically: the notification steps fail if the
    // real dispatcher were ever reached.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionAccountingJourneyCast(PREFIX);

    // Two real class instances — the booking ledger key is derived from
    // (studentId, classInstanceId, operation), so each successful deduction
    // needs its own instance row to satisfy the FK honestly.
    await db.transaction(async tx => {
      teacherUser = await createTestUser(tx, { name: `${PREFIX} Teacher` });
      teacher = await createTestTeacher(tx, teacherUser.id);
      instanceAbove = await createMockClassInstance(tx, cast.student.id, teacher.id);
      instanceBelow = await createMockClassInstance(tx, cast.student.id, teacher.id);
    });

    // The threshold is env-config (seeded 2.00 in migration 34, default 5) —
    // read it the same way the notifier does instead of hardcoding a value.
    const resolution = await resolveLowHoursThreshold();
    if (resolution.value === null) {
      throw new Error(`Low-hours threshold is not parseable: ${resolution.rawValue}`);
    }
    threshold = resolution.value;
    aboveThresholdDeduct = PURCHASE_HOURS - (threshold + 1);
    if (aboveThresholdDeduct <= 0 || threshold - BELOW_THRESHOLD_DEDUCT < 0) {
      throw new Error(`Journey arithmetic requires 2 <= threshold <= ${PURCHASE_HOURS - 2}, got ${threshold}`);
    }
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await db.delete(classInstances).where(eq(classInstances.id, instanceAbove.id));
    await db.delete(classInstances).where(eq(classInstances.id, instanceBelow.id));
    await db.delete(teachers).where(eq(teachers.id, teacher.id));
    await db.delete(users).where(eq(users.id, teacherUser.id));
    await cleanupAccountingJourneyCast(cast);
  });

  function fundingInput(): AccountingPaymentSubmitInput {
    return {
      studentId: cast.student.id,
      packagePlanId: cast.plan.id,
      creditHours: PURCHASE_HOURS,
      amount: 300,
      currency: CurrencyCode.USD,
      paymentGateway: PaymentGateway.PAYPAL,
      paymentDate: new Date("2026-08-01T12:00:00.000Z"),
      isPaidStatusOn: true,
      paymentNote: `${PREFIX} funding`,
    };
  }

  /** Sanctioned v1 path: the caller owns the transaction (no booking producer yet). */
  async function deductViaService(instanceId: string, hours: number, idempotencyKey: string): Promise<void> {
    await db.transaction(async tx => {
      await CreditService.deductHoursForBooking(
        cast.student.id,
        instanceId,
        hours,
        cast.adminUser.id,
        idempotencyKey,
        tx,
        tErrors
      );
    });
  }

  async function readStudentRow() {
    const [row] = await db.select().from(students).where(eq(students.id, cast.student.id)).limit(1);
    return row;
  }

  test("step 1 — admin funds the account with an hour package (balance starts above the threshold)", async () => {
    const recorded = await AccountingPaymentService.recordPayment(cast.adminUser.id, fundingInput(), tErrors);
    expect(recorded.studentId).toBe(cast.student.id);

    const studentRow = await readStudentRow();
    expect(Number(studentRow?.creditHoursTotal ?? "0")).toBe(PURCHASE_HOURS);
    expect(Number(studentRow?.creditHoursRemaining ?? "0")).toBe(PURCHASE_HOURS);
    expect(Number(studentRow?.creditHoursRemaining ?? "0")).toBeGreaterThan(threshold);
  });

  test("step 2 — deduction landing above the threshold writes the ledger row and dispatches NO alert", async () => {
    await deductViaService(instanceAbove.id, aboveThresholdDeduct, `${PREFIX}-deduct-above`);

    // Shared state: a negative-hour DEDUCTION row on the hour ledger (XOR:
    // changeAmount stays null) and the denormalized balance moved with it.
    const hourRows = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, cast.student.id));
    expect(hourRows).toHaveLength(2); // purchase (step 1) + this deduction
    const deduction = hourRows.find(row => row.reason === CreditReason.DEDUCTION.valueOf());
    expect(Number(deduction?.changeAmountHours ?? "0")).toBe(-aboveThresholdDeduct);
    expect(deduction?.changeAmount).toBeNull();
    expect(deduction?.classInstanceId).toBe(instanceAbove.id);

    const studentRow = await readStudentRow();
    expect(Number(studentRow?.creditHoursRemaining ?? "0")).toBe(threshold + 1);

    // The wiring entry point itself decides there is nothing to send: the
    // balance still clears the threshold, so no ACCOUNTING_LOW_HOURS payload.
    await AccountingNotificationService.maybeNotifyLowHours(cast.student.id);
    expect(dispatchTargetsForEvent(dispatchSpy, NotificationEventType.ACCOUNTING_LOW_HOURS)).toHaveLength(0);
  });

  test("step 3 — dropping to/below the threshold alerts the student and the linked parent only", async () => {
    await deductViaService(instanceBelow.id, BELOW_THRESHOLD_DEDUCT, `${PREFIX}-deduct-below`);
    const remaining = threshold - 1;

    const studentRow = await readStudentRow();
    expect(Number(studentRow?.creditHoursRemaining ?? "0")).toBe(remaining);

    // The family sees the reduced balance through the association-scoped read.
    await Promise.all(
      [cast.studentUser.id, cast.parentUser.id].map(async actorId => {
        const balance = await AccountingPaymentService.getStudentBalance(actorId, cast.student.id, tErrors);
        expect(Number(balance.creditHoursRemaining)).toBe(remaining);
      })
    );

    // Post-commit wiring probe: now the balance is below the threshold.
    await AccountingNotificationService.maybeNotifyLowHours(cast.student.id);
    expect(
      await waitForEventDispatchToUser(dispatchSpy, NotificationEventType.ACCOUNTING_LOW_HOURS, cast.studentUser.id)
    ).toBe(true);
    expect(
      await waitForEventDispatchToUser(dispatchSpy, NotificationEventType.ACCOUNTING_LOW_HOURS, cast.parentUser.id)
    ).toBe(true);

    // Recipients are exactly the family. Admin fan-out was deferred in
    // Phase 12, so academy admins and staff must NOT appear as targets.
    const targets = dispatchTargetsForEvent(dispatchSpy, NotificationEventType.ACCOUNTING_LOW_HOURS);
    expect(targets).toContain(cast.studentUser.id);
    expect(targets).toContain(cast.parentUser.id);
    expect(targets).not.toContain(cast.adminUser.id);
    expect(targets).not.toContain(cast.staffViewerUser.id);
    expect(targets).not.toContain(cast.unrelatedStudentUser.id);
    expect(targets).not.toContain(cast.unrelatedParentUser.id);
  });

  test("step 4 — deduction beyond the balance is rejected and produces no row and no alert", async () => {
    const remaining = threshold - 1;
    const required = remaining + PURCHASE_HOURS;

    const denied = await expectJourneyError(() =>
      deductViaService(instanceBelow.id, required, `${PREFIX}-deduct-denied`)
    );
    expect(denied).toBeInstanceOf(ConflictError);
    expect(denied.message).toContain(
      tErrors.credit.insufficientHours({ studentId: cast.student.id, remaining, required })
    );

    // Nothing was written: the ledger still holds exactly the three committed
    // rows and the balance is untouched.
    const hourRows = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, cast.student.id));
    expect(hourRows).toHaveLength(3);
    const studentRow = await readStudentRow();
    expect(Number(studentRow?.creditHoursRemaining ?? "0")).toBe(remaining);

    // A failed deduction never triggers the low-hours wiring — the alert set
    // is still exactly step 3's student + parent pair.
    const targets = dispatchTargetsForEvent(dispatchSpy, NotificationEventType.ACCOUNTING_LOW_HOURS);
    expect(targets).toHaveLength(2);
  });
});
