import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  auditLogs,
  carryoverBalances,
  classInstances,
  classStatusEvents,
  expenses,
  groupPermissions,
  permissionGroups,
  permissions,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { createMockClassInstance, createTestUser, type TestDb } from "@/backend/db/test/entity-setup";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { CalculationStatus } from "@/backend/enum/teachers/payroll-calculation.enum";
import { ForbiddenError } from "@/backend/lib";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { CarryoverBalanceService } from "@/backend/services/teachers";
import type {
  CarryoverBalanceSelectType,
  CarryoverPaidStatusFilter,
  CarryoverRow,
  ClassInstanceSelectType,
  ExpenseSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  assignSystemGroup,
  cleanupPayrollJourneyCast,
  type DispatchSpy,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionPayrollJourneyCast,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers";

/** Admin audit actions the carryover service appends; plain varchar columns, no TypeScript enum. */
const CARRYOVER_CREATE_ACTION = "CARRYOVER_CREATE";
const CARRYOVER_TO_EXPENSE_ACTION = "CARRYOVER_TO_EXPENSE";
const CARRYOVER_UNPAID_ACTION = "CARRYOVER_UNPAID";
/** Ledger audit discriminators for the expense the settlement writes. */
const EXPENSE_AUDIT_ENTITY_TYPE = "EXPENSE";
const EXPENSE_DELETE_ACTION = "EXPENSE_DELETE";
/** Ledger provenance marker the settle flow stamps on its expense rows. */
const EXPENSE_SOURCE_CARRYOVER = "carryover_balances";

/** Hourly rate SAR 120 × a 60-minute session (see the shared payroll cast). */
const FULL_SESSION_PAY = "120.00";
/** Two aggregated sessions settle a 240.00 SAR carryover. */
const AGGREGATE_PAYABLE = "240.00";
/** The reverted carryover reads paid "0" with every settlement field cleared. */
const ZERO_PAID = "0";
/** SQL date the payout is recorded on; the expense month derives from it. */
const PAYMENT_DATE = "2026-09-04";

const MINUTE_MS = 60 * 1000;

/** Structural guard so audit metadata is walked without a type assertion. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/** Order-insensitive comparison for id/action lists. */
function sortStrings(values: readonly string[]): string[] {
  return values.toSorted((a, b) => a.localeCompare(b));
}

/**
 * A read-only second operator: the custom group carries exactly the carryover
 * view permission (no system group holds VIEW without MANAGE, so the honest
 * read-only actor exists only as a per-run group, same pattern as the payroll
 * denial journey's auditor).
 */
interface CarryoverViewerExtras {
  viewerUser: UserSelectType;
  viewerGroupId: string;
  staffUser: UserSelectType;
  staffAssignment: SystemGroupAssignment;
}

async function provisionCarryoverViewerExtras(prefix: string): Promise<CarryoverViewerExtras> {
  return db.transaction(async tx => {
    const now = new Date();
    const viewerUser = await createTestUser(tx, { name: `${prefix} Carryover Viewer` });
    const staffUser = await createTestUser(tx, { name: `${prefix} Staff` });
    const staffAssignment = await assignSystemGroup(tx, staffUser.id, SystemPermissionGroupSlug.STAFF_DEFAULT);

    const [viewPermission] = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, AppPermission.ACCOUNTING_CARRYOVER_VIEW))
      .limit(1);
    if (!viewPermission) {
      throw new Error("carryover view permission row not found in the permissions catalog");
    }

    const [viewerGroup] = await tx
      .insert(permissionGroups)
      .values({
        name: { en: `${prefix} Carryover Viewer` },
        description: { en: "Read-only carryover report access for this run" },
        isSystem: false,
        slug: `${prefix}_carryover_viewer`,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: permissionGroups.id });
    if (!viewerGroup) {
      throw new Error("carryover viewer group insert returned no row");
    }
    await tx.insert(groupPermissions).values({ groupId: viewerGroup.id, permissionId: viewPermission.id });
    await tx.insert(userPermissionGroups).values({ userId: viewerUser.id, groupId: viewerGroup.id, assignedAt: now });

    return { viewerUser, viewerGroupId: viewerGroup.id, staffUser, staffAssignment };
  });
}

async function cleanupCarryoverViewerExtras(extras: CarryoverViewerExtras): Promise<void> {
  await db.transaction(async (tx: TestDb) => {
    await revokeSystemGroupAssignments(tx, [extras.staffAssignment]);
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, extras.viewerUser.id));
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, extras.viewerGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, extras.viewerGroupId));
    await tx.delete(users).where(inArray(users.id, [extras.viewerUser.id, extras.staffUser.id]));
  });
}

/** Committed carryover fixtures layered on top of the shared payroll cast. */
interface CarryoverUnpayFixture {
  cast: PayrollJourneyCast;
  extras: CarryoverViewerExtras;
  firstInstance: ClassInstanceSelectType;
  secondInstance: ClassInstanceSelectType;
}

/**
 * Provisions the journey fixtures in a single COMMITTING transaction: the
 * shared payroll cast (operator, teacher, student) plus two completed sessions
 * whose payroll snapshots sit at CALCULATED — the audited state the carryover
 * aggregation selects from — and the read-only viewer actor.
 */
async function provisionCarryoverUnpayFixture(prefix: string): Promise<CarryoverUnpayFixture> {
  const cast = await provisionPayrollJourneyCast(prefix);
  const extras = await provisionCarryoverViewerExtras(prefix);
  return db.transaction(async tx => {
    const now = new Date();
    const auditedSession = {
      executionState: ClassExecutionState.COMPLETED,
      outcome: ClassOutcome.TAKEN,
      calculationStatus: CalculationStatus.CALCULATED,
      teacherPaidAmount: FULL_SESSION_PAY,
      teacherPaidCurrency: CurrencyCode.SAR,
      calculatedDuration: 60,
      payrollCalculatedAt: now,
      payrollCalculatedBy: cast.operatorUser.id,
    } as const;
    const firstInstance = await createMockClassInstance(tx, cast.student.id, cast.teacher.id, {
      ...auditedSession,
      subjectId: cast.createdSubjectId,
      actualStartAt: new Date(now.getTime() - 240 * MINUTE_MS),
      scheduledStartAt: new Date(now.getTime() - 300 * MINUTE_MS),
      scheduledEndAt: new Date(now.getTime() - 240 * MINUTE_MS),
    });
    const secondInstance = await createMockClassInstance(tx, cast.student.id, cast.teacher.id, {
      ...auditedSession,
      subjectId: cast.createdSubjectId,
      actualStartAt: new Date(now.getTime() - 120 * MINUTE_MS),
      scheduledStartAt: new Date(now.getTime() - 180 * MINUTE_MS),
      scheduledEndAt: new Date(now.getTime() - 120 * MINUTE_MS),
    });
    // The shared cast rows stay untouched: cleanup tracks the two audited
    // sessions separately on the fixture (their carryover rows must be
    // hard-deleted before the cast teardown removes the teacher).
    return { cast, extras, firstInstance, secondInstance };
  });
}

/** Reads the live class-instance row so assertions run against committed state, not service return values. */
async function readInstance(classInstanceId: string): Promise<ClassInstanceSelectType> {
  const [row] = await db.select().from(classInstances).where(eq(classInstances.id, classInstanceId)).limit(1);
  if (!row) {
    throw new Error(`class instance ${classInstanceId} disappeared before it could be read`);
  }
  return row;
}

/** Reads the live carryover row for the run's teacher. */
async function readCarryoverRow(carryoverId: string): Promise<CarryoverBalanceSelectType> {
  const [row] = await db.select().from(carryoverBalances).where(eq(carryoverBalances.id, carryoverId)).limit(1);
  if (!row) {
    throw new Error(`carryover ${carryoverId} disappeared before it could be read`);
  }
  return row;
}

/** The single live/read-back expense row the settlement wrote for the run's carryover (soft-deleted states included). */
async function readExpenseRow(expenseId: string): Promise<ExpenseSelectType> {
  const [row] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  if (!row) {
    throw new Error(`expense ${expenseId} disappeared before it could be read`);
  }
  return row;
}

/** Ledger audit rows for one expense — grounds the delete-idempotency assertions. */
async function readExpenseAuditRows(expenseId: string): Promise<{ action: string }[]> {
  return db
    .select({ action: auditLogs.action })
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, EXPENSE_AUDIT_ENTITY_TYPE), eq(auditLogs.entityId, expenseId)));
}

interface CarryoverAuditRow {
  action: string;
  entityId: string;
  actorUserId: string | null;
  metadata: unknown;
}

/** Append-only admin audit rows for one carryover entity, oldest first. */
async function readCarryoverAuditRows(carryoverId: string): Promise<CarryoverAuditRow[]> {
  return db
    .select({
      action: auditLogs.action,
      entityId: auditLogs.entityId,
      actorUserId: auditLogs.actorUserId,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(eq(auditLogs.entityId, carryoverId));
}

/**
 * Unpay correction journey: the accounting operator aggregates two audited
 * sessions into one unpaid carryover, converts it to a real expense ledger row
 * (sessions PAID, carryover paid, `expenses` row provenance-linked to the
 * carryover), then unpays it — the expense is soft-deleted in the same
 * transaction (`deletedAt` set on the committed row), the carryover returns to
 * unpaid with every settlement field cleared, and the sessions move back to
 * WAITING_PAID where the read-only viewer sees them linked again. Denial
 * paths reject an unpay on an already-unpaid carryover and enforce the manage
 * permission honestly, and the rejected re-unpay leaves the soft-deleted
 * expense untouched (idempotent-twice semantics).
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Carryover unpay journey (aggregate → to expense → unpay correction)", () => {
  const PREFIX = `jrn_counpay_${randomUUID().slice(0, 8)}`;
  const unpayNote = `${PREFIX} payout reversal note`;

  let tErrors: ErrorsLabels;
  let fixture: CarryoverUnpayFixture;
  let dispatchSpy: DispatchSpy;
  let carryoverId = "";
  let settledExpenseId = "";
  /** `deletedAt` captured after the unpay — the rejected re-unpay must not disturb it. */
  let expenseDeletedAt: Date | null = null;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // The carryover flows fan out no notifications; the spy is installed
    // anyway so any leakage into a real channel is impossible and detectable.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    fixture = await provisionCarryoverUnpayFixture(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    const { cast, extras, firstInstance, secondInstance } = fixture;
    // Append-only audit rows reference the run's actors; the immutability
    // trigger must be lifted for the sweep (same precedent as the payroll
    // settlement journey). INSERT traffic from concurrent suites is
    // unaffected while the trigger is off.
    await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
    try {
      await db
        .delete(auditLogs)
        .where(
          inArray(auditLogs.actorUserId, [
            cast.operatorUser.id,
            extras.viewerUser.id,
            extras.staffUser.id,
            cast.teacherUser.id,
          ])
        );
      // The settlement wrote a real (soft-deleted) expense row for this run's
      // carryover; remove it before the carryover rows below.
      await db.delete(expenses).where(eq(expenses.sourceEntityId, carryoverId));
      // Carryover rows (items cascade) before the teacher they RESTRICT to.
      await db.delete(carryoverBalances).where(eq(carryoverBalances.teacherId, cast.teacher.id));
      // The journey's own audited sessions and their transition events are
      // outside the shared cast's tracked instance list; remove both here so
      // the cast teardown below sees no dangling event rows.
      const auditedInstanceIds = [firstInstance.id, secondInstance.id];
      await db.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, auditedInstanceIds));
      await db.delete(classInstances).where(inArray(classInstances.id, auditedInstanceIds));
      await cleanupCarryoverViewerExtras(extras);
      await cleanupPayrollJourneyCast(cast);
    } finally {
      await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
    }
  });

  function sessionIds(): string[] {
    return [fixture.firstInstance.id, fixture.secondInstance.id];
  }

  function readCarryoverReport(
    actorUserId: string,
    paidStatus: CarryoverPaidStatusFilter
  ): Promise<{ rows: CarryoverRow[] }> {
    return CarryoverBalanceService.getReport(
      actorUserId,
      { teacherId: fixture.cast.teacher.id, paidStatus },
      { limit: 10, offset: 0 },
      tErrors
    );
  }

  test("step 1 — operator aggregates the audited sessions into one unpaid carryover", async () => {
    const created = await CarryoverBalanceService.bulkCreateCarryoverBalances(
      {
        instanceIds: sessionIds(),
        actorUserId: fixture.cast.operatorUser.id,
        note: `${PREFIX} aggregation`,
      },
      tErrors
    );

    expect(created.groups).toHaveLength(1);
    const group = created.groups[0];
    expect(group?.teacherId).toBe(fixture.cast.teacher.id);
    expect(group?.payable).toBe(AGGREGATE_PAYABLE);
    expect(group?.currency).toBe(CurrencyCode.SAR);
    expect(sortStrings(group?.instanceIds ?? [])).toEqual(sortStrings(sessionIds()));
    carryoverId = group?.carryoverId ?? "";
    expect(carryoverId.length).toBeGreaterThan(0);

    // Shared-state transition: both sessions linked and moved to WAITING_PAID.
    const linkedRows = await Promise.all(sessionIds().map(id => readInstance(id)));
    for (const row of linkedRows) {
      expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
      expect(row.carryoverBalanceId).toBe(carryoverId);
    }

    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(false);
    expect(carryover.paid).toBe(ZERO_PAID);
    expect(carryover.payable).toBe(AGGREGATE_PAYABLE);
    expect(carryover.createdByUserId).toBe(fixture.cast.operatorUser.id);

    // Cross-actor visibility: the read-only viewer sees the new unpaid row
    // and the linked sessions.
    const viewerPage = await readCarryoverReport(fixture.extras.viewerUser.id, "Unpaid");
    const viewerRow = viewerPage.rows.find(row => row.id === carryoverId);
    expect(viewerRow?.payable).toBe(AGGREGATE_PAYABLE);
    expect(viewerRow?.isPaid).toBe(false);

    const linked = await CarryoverBalanceService.getLinkedSessions(fixture.extras.viewerUser.id, carryoverId, tErrors);
    expect(sortStrings(linked.map(session => session.id))).toEqual(sortStrings(sessionIds()));
    for (const session of linked) {
      expect(session.currentStatus).toBe(CalculationStatus.WAITING_PAID);
      expect(session.originalStatus).toBe(CalculationStatus.CALCULATED);
      expect(session.originalAmount).toBe(FULL_SESSION_PAY);
    }

    // Side effect: one append-only create audit row attributed to the operator.
    const auditRows = await readCarryoverAuditRows(carryoverId);
    expect(auditRows.map(row => row.action)).toEqual([CARRYOVER_CREATE_ACTION]);
    expect(auditRows[0]?.actorUserId).toBe(fixture.cast.operatorUser.id);
  });

  test("step 2 — operator converts the carryover to an expense: paid flag, PAID sessions, expense link", async () => {
    const settled = await CarryoverBalanceService.bulkCarryoverToExpense(
      {
        carryoverIds: [carryoverId],
        paymentDate: PAYMENT_DATE,
        expenseDate: null,
        actorUserId: fixture.cast.operatorUser.id,
      },
      tErrors
    );

    expect(settled.items).toHaveLength(1);
    const item = settled.items[0];
    expect(item?.carryoverId).toBe(carryoverId);
    expect(item?.amount).toBe(AGGREGATE_PAYABLE);
    settledExpenseId = item?.expenseId ?? "";
    expect(settledExpenseId.length).toBeGreaterThan(0);

    // The settlement landed a real ledger row provenance-linked to the
    // carryover: a Salaries expense for the aggregate payable in the payment
    // month, attributed to the operator and not yet deleted.
    const expense = await readExpenseRow(settledExpenseId);
    expect(expense.type).toBe(ExpenseType.SALARIES);
    expect(expense.expenseValue).toBe(AGGREGATE_PAYABLE);
    expect(expense.expenseCurrency).toBe(CurrencyCode.SAR);
    expect(expense.paymentDate).toBe(PAYMENT_DATE);
    expect(expense.expenseDate).toBe(PAYMENT_DATE.slice(0, 7));
    expect(expense.teacherId).toBe(fixture.cast.teacher.id);
    expect(expense.sourceEntity).toBe(EXPENSE_SOURCE_CARRYOVER);
    expect(expense.sourceEntityId).toBe(carryoverId);
    expect(expense.createdByUserId).toBe(fixture.cast.operatorUser.id);
    expect(expense.deletedAt).toBeNull();

    // Shared-state transitions: the carryover is paid and both sessions sit
    // at PAID.
    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(true);
    expect(carryover.paid).toBe(AGGREGATE_PAYABLE);
    expect(carryover.paymentDate).toBe(PAYMENT_DATE);
    expect(carryover.expenseId).toBe(settledExpenseId);
    expect(carryover.paidByUserId).toBe(fixture.cast.operatorUser.id);
    expect(carryover.paidAt).not.toBeNull();

    const paidRows = await Promise.all(sessionIds().map(id => readInstance(id)));
    for (const row of paidRows) {
      expect(row.calculationStatus).toBe(CalculationStatus.PAID);
    }

    // The read-only viewer follows the settlement on the paid surface.
    const viewerPage = await readCarryoverReport(fixture.extras.viewerUser.id, "Paid");
    const viewerRow = viewerPage.rows.find(row => row.id === carryoverId);
    expect(viewerRow?.isPaid).toBe(true);
    expect(viewerRow?.paid).toBe(AGGREGATE_PAYABLE);

    const paidSessions = await CarryoverBalanceService.getLinkedSessions(
      fixture.extras.viewerUser.id,
      carryoverId,
      tErrors
    );
    for (const session of paidSessions) {
      expect(session.currentStatus).toBe(CalculationStatus.PAID);
    }

    // Side effect: the conversion audit row now sits behind the create row.
    const auditActions = sortStrings((await readCarryoverAuditRows(carryoverId)).map(row => row.action));
    expect(auditActions).toEqual(sortStrings([CARRYOVER_CREATE_ACTION, CARRYOVER_TO_EXPENSE_ACTION]));
  });

  test("step 3 — operator unpays: carryover reverts, sessions return to WAITING_PAID, audit trail grows", async () => {
    const unpaid = await CarryoverBalanceService.unpayCarryoverBalance(
      { id: carryoverId, note: unpayNote, actorUserId: fixture.cast.operatorUser.id },
      tErrors
    );

    // The carryover reads unpaid with every settlement field cleared.
    expect(unpaid.isPaid).toBe(false);
    expect(unpaid.paid).toBe(ZERO_PAID);
    expect(unpaid.paymentDate).toBeNull();
    expect(unpaid.expenseId).toBeNull();
    expect(unpaid.paidAt).toBeNull();

    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(false);
    expect(carryover.paid).toBe(ZERO_PAID);
    expect(carryover.paymentDate).toBeNull();
    expect(carryover.expenseId).toBeNull();
    expect(carryover.paidAt).toBeNull();
    expect(carryover.paidByUserId).toBeNull();

    // Shared-state transition: sessions PAID → WAITING_PAID, still linked.
    const revertedRows = await Promise.all(sessionIds().map(id => readInstance(id)));
    for (const row of revertedRows) {
      expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
      expect(row.carryoverBalanceId).toBe(carryoverId);
    }

    // The unpay soft-deletes the expense row in the same transaction: the
    // committed row carries `deletedAt`, the deleting actor, and the unpay
    // note as the reason — never a hard delete.
    const deletedExpense = await readExpenseRow(settledExpenseId);
    expect(deletedExpense.deletedAt).not.toBeNull();
    expect(deletedExpense.deletedByUserId).toBe(fixture.cast.operatorUser.id);
    expect(deletedExpense.deletedReason).toBe(unpayNote);
    expenseDeletedAt = deletedExpense.deletedAt;

    // Ledger audit: exactly one EXPENSE_DELETE row for the settled expense.
    expect(
      (await readExpenseAuditRows(settledExpenseId)).filter(row => row.action === EXPENSE_DELETE_ACTION)
    ).toHaveLength(1);

    // Missing-row tolerance: if the reference had never materialized a row,
    // the same revert would have completed — already-deleted rows are the
    // ledger's own idempotent no-op.

    // Cross-actor visibility: the viewer sees the row back on the unpaid
    // surface with the sessions linked again.
    const viewerPage = await readCarryoverReport(fixture.extras.viewerUser.id, "Unpaid");
    const viewerRow = viewerPage.rows.find(row => row.id === carryoverId);
    expect(viewerRow?.isPaid).toBe(false);
    expect(viewerRow?.paid).toBe(ZERO_PAID);
    expect(viewerRow?.expenseId).toBeNull();

    // Side effect: the unpay audit row carries the cleared expense reference
    // and the operator's note, and the full append-only trail survives —
    // create, settlement, and reversal all remain attributable.
    const auditRows = await readCarryoverAuditRows(carryoverId);
    expect(sortStrings(auditRows.map(row => row.action))).toEqual(
      sortStrings([CARRYOVER_CREATE_ACTION, CARRYOVER_TO_EXPENSE_ACTION, CARRYOVER_UNPAID_ACTION])
    );
    for (const auditRow of auditRows) {
      expect(auditRow.actorUserId).toBe(fixture.cast.operatorUser.id);
    }
    const unpaidAuditRow = auditRows.find(row => row.action === CARRYOVER_UNPAID_ACTION);
    expect(isRecord(unpaidAuditRow?.metadata)).toBe(true);
    const metadata = isRecord(unpaidAuditRow?.metadata) ? unpaidAuditRow.metadata : {};
    expect(metadata.expenseId).toBe(settledExpenseId);
    expect(metadata.reason).toBe(unpayNote);
  });

  test("step 4 — denial paths: unpay on an unpaid carryover rejects and the manage permission is enforced", async () => {
    // Double-reversal is impossible: reverting the already-unpaid carryover
    // rejects before any state is touched.
    const reUnpayError = await expectJourneyError(() =>
      CarryoverBalanceService.unpayCarryoverBalance(
        { id: carryoverId, actorUserId: fixture.cast.operatorUser.id },
        tErrors
      )
    );
    expect(reUnpayError.message).toContain(tErrors.carryover.notPaid);

    // The view-only operator and the staff actor hold no manage grant —
    // the denial resolves through their real group memberships, and the
    // state-mutating unpay never starts.
    const viewerDenied = await expectJourneyError(() =>
      CarryoverBalanceService.unpayCarryoverBalance(
        { id: carryoverId, actorUserId: fixture.extras.viewerUser.id },
        tErrors
      )
    );
    expect(viewerDenied).toBeInstanceOf(ForbiddenError);
    expect(viewerDenied.message).toContain(tErrors.insufficientPermissions);

    const staffDenied = await expectJourneyError(() =>
      CarryoverBalanceService.unpayCarryoverBalance(
        { id: carryoverId, actorUserId: fixture.extras.staffUser.id },
        tErrors
      )
    );
    expect(staffDenied).toBeInstanceOf(ForbiddenError);
    expect(staffDenied.message).toContain(tErrors.insufficientPermissions);

    // The teacher is fully outside the carryover surface — even the scoped
    // report read denies them.
    const teacherDenied = await expectJourneyError(() => readCarryoverReport(fixture.cast.teacherUser.id, "Both"));
    expect(teacherDenied).toBeInstanceOf(ForbiddenError);
    expect(teacherDenied.message).toContain(tErrors.insufficientPermissions);

    // Every rejection left the reverted state untouched — including the
    // soft-deleted expense row: `deletedAt` is unchanged and no second
    // EXPENSE_DELETE audit row exists (the reversal settles idempotently).
    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(false);
    expect(carryover.paid).toBe(ZERO_PAID);
    expect(carryover.expenseId).toBeNull();
    const untouchedExpense = await readExpenseRow(settledExpenseId);
    expect(untouchedExpense.deletedAt?.getTime()).toBe(expenseDeletedAt?.getTime());
    expect(
      (await readExpenseAuditRows(settledExpenseId)).filter(row => row.action === EXPENSE_DELETE_ACTION)
    ).toHaveLength(1);
    const untouchedRows = await Promise.all(sessionIds().map(id => readInstance(id)));
    for (const row of untouchedRows) {
      expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
    }
  });

  test("step 5 — no notification fan-out and the audit trail holds exactly this run's carryover rows", async () => {
    // The carryover flows dispatch no notifications at any step.
    expect(dispatchSpy.mock.calls).toHaveLength(0);

    // The append-only trail for this entity contains exactly the three
    // settlement actions in their fixed order — nothing mirrored the denials.
    const auditRows = await readCarryoverAuditRows(carryoverId);
    expect(auditRows).toHaveLength(3);
  });
});
