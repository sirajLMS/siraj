import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
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
import { ExpenseService } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { CarryoverBalanceService } from "@/backend/services/teachers";
import type {
  CarryoverBalanceSelectType,
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
  deleteAuditLogsByActorIds,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionPayrollJourneyCast,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers";

/** Carryover audit actions the settlement/unpay flow appends (plain varchar, no TS enum). */
const CARRYOVER_UNPAID_ACTION = "CARRYOVER_UNPAID";
/** Ledger audit discriminators for the expenses written by this run. */
const EXPENSE_AUDIT_ENTITY_TYPE = "EXPENSE";
const EXPENSE_CREATE_ACTION = "EXPENSE_CREATE";
const EXPENSE_DELETE_ACTION = "EXPENSE_DELETE";
/** Ledger provenance marker the settlement stamps on its expense rows. */
const EXPENSE_SOURCE_CARRYOVER = "carryover_balances";

/** Hourly rate SAR 120 × a 60-minute session (shared payroll cast convention). */
const FULL_SESSION_PAY = "120.00";
/** Two aggregated sessions settle a 240.00 SAR carryover and its expense. */
const AGGREGATE_PAYABLE = "240.00";
/** The reverted carryover reads paid "0" with every settlement field cleared. */
const ZERO_PAID = "0";
/** The manual expense used as the bystander row in the bulk-delete rollback step. */
const MANUAL_EXPENSE_VALUE = "75.00";
/** SQL date the payout is recorded on; the expense month derives from it. */
const PAYMENT_DATE = "2026-09-04";
/** Accounting month of the manual expense. */
const MANUAL_EXPENSE_MONTH = "2026-09";

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
 * Extra actors provisioned per run on top of the shared payroll cast: a
 * read-only expense auditor whose one custom group carries exactly the ledger
 * view permission (mirrors the carryover journey's viewer — view stays honest
 * through the real group-membership join, never a mocked permission), and a
 * staff user who holds no accounting permissions at all.
 */
interface ExpenseJourneyExtras {
  viewerUser: UserSelectType;
  viewerGroupId: string;
  staffUser: UserSelectType;
  staffAssignment: SystemGroupAssignment;
}

async function provisionExpenseJourneyExtras(prefix: string): Promise<ExpenseJourneyExtras> {
  return db.transaction(async tx => {
    const now = new Date();
    const viewerUser = await createTestUser(tx, { name: `${prefix} Expense Viewer` });
    const staffUser = await createTestUser(tx, { name: `${prefix} Staff` });
    const staffAssignment = await assignSystemGroup(tx, staffUser.id, SystemPermissionGroupSlug.STAFF_DEFAULT);

    const [viewPermission] = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, AppPermission.ACCOUNTING_EXPENSES_VIEW))
      .limit(1);
    if (!viewPermission) {
      throw new Error("expense view permission row not found in the permissions catalog");
    }

    const [viewerGroup] = await tx
      .insert(permissionGroups)
      .values({
        name: { en: `${prefix} Expense Viewer` },
        description: { en: "Read-only expense ledger access for this run" },
        isSystem: false,
        slug: `${prefix}_expense_viewer`,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: permissionGroups.id });
    if (!viewerGroup) {
      throw new Error("expense viewer group insert returned no row");
    }
    await tx.insert(groupPermissions).values({ groupId: viewerGroup.id, permissionId: viewPermission.id });
    await tx.insert(userPermissionGroups).values({ userId: viewerUser.id, groupId: viewerGroup.id, assignedAt: now });

    return { viewerUser, viewerGroupId: viewerGroup.id, staffUser, staffAssignment };
  });
}

async function cleanupExpenseJourneyExtras(extras: ExpenseJourneyExtras): Promise<void> {
  await db.transaction(async (tx: TestDb) => {
    await revokeSystemGroupAssignments(tx, [extras.staffAssignment]);
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, extras.viewerUser.id));
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, extras.viewerGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, extras.viewerGroupId));
    await tx.delete(users).where(inArray(users.id, [extras.viewerUser.id, extras.staffUser.id]));
  });
}

/** Committed journey fixtures layered on top of the shared payroll cast. */
interface UnpaySoftDeleteFixture {
  cast: PayrollJourneyCast;
  extras: ExpenseJourneyExtras;
  firstInstance: ClassInstanceSelectType;
  secondInstance: ClassInstanceSelectType;
}

/**
 * Provisions the journey fixtures in COMMITTING transactions: the shared
 * payroll cast (operator, teacher, student) plus two completed sessions whose
 * payroll snapshots sit at CALCULATED — the audited state the carryover
 * aggregation selects from — and the view-only/staff actors.
 */
async function provisionUnpaySoftDeleteFixture(prefix: string): Promise<UnpaySoftDeleteFixture> {
  const cast = await provisionPayrollJourneyCast(prefix);
  const extras = await provisionExpenseJourneyExtras(prefix);
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

/** Reads the live expense row (soft-deleted states included) so assertions run against committed state. */
async function readExpenseRow(expenseId: string): Promise<ExpenseSelectType> {
  const [row] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  if (!row) {
    throw new Error(`expense ${expenseId} disappeared before it could be read`);
  }
  return row;
}

/** Reads the live carryover row for the run. */
async function readCarryoverRow(carryoverId: string): Promise<CarryoverBalanceSelectType> {
  const [row] = await db.select().from(carryoverBalances).where(eq(carryoverBalances.id, carryoverId)).limit(1);
  if (!row) {
    throw new Error(`carryover ${carryoverId} disappeared before it could be read`);
  }
  return row;
}

interface ExpenseAuditRow {
  action: string;
  actorUserId: string | null;
  metadata: unknown;
}

/** Ledger audit rows for one expense, oldest first — grounds every side-effect assertion. */
async function readExpenseAuditRows(expenseId: string): Promise<ExpenseAuditRow[]> {
  return db
    .select({ action: auditLogs.action, actorUserId: auditLogs.actorUserId, metadata: auditLogs.metadata })
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, EXPENSE_AUDIT_ENTITY_TYPE), eq(auditLogs.entityId, expenseId)));
}

/**
 * Unpay-to-soft-delete journey: the accounting operator aggregates two audited
 * sessions into one carryover, settles it into a real Salaries expense, then
 * tries to remove that expense directly — the protected row rejects every
 * direct path (`EXPENSE_DELETE_VIA_UNPAY`), and a bulk delete containing it
 * rolls back atomically leaving the bystander manual expense untouched. The
 * operator then reverses the payout through the carryover Unpay flow: the
 * linked expense is soft-deleted in the same transaction that reverts the
 * carryover (`deletedAt`/`deletedByUserId`/reason all set atomically), the
 * default ledger view hides the row while `includeDeleted` keeps it visible
 * with its deletion marker, exactly one EXPENSE_DELETE audit row carries the
 * unpay note as its reason, and denial paths (double unpay, view-only/staff/
 * teacher actors) leave the reverted state untouched.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Carryover unpay → expense soft-delete journey (settle → protected delete → unpay)", () => {
  const PREFIX = `jrn_expunpay_${randomUUID().slice(0, 8)}`;
  const unpayNote = `${PREFIX} payout reversal note`;

  let tErrors: ErrorsLabels;
  let fixture: UnpaySoftDeleteFixture;
  let dispatchSpy: DispatchSpy;
  let carryoverId = "";
  let settledExpenseId = "";
  let manualExpenseId = "";
  /** `deletedAt` captured after the unpay — the rejected re-unpay must not disturb it. */
  let expenseDeletedAt: Date | null = null;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // The carryover/ledger flows fan out no notifications; the spy is
    // installed anyway so any leakage into a real channel is impossible and
    // detectable.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    fixture = await provisionUnpaySoftDeleteFixture(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    const { cast, extras, firstInstance, secondInstance } = fixture;
    // Append-only audit rows reference the run's actors; sweep them through
    // the transaction-scoped audit maintenance window.
    await deleteAuditLogsByActorIds([
      cast.operatorUser.id,
      extras.viewerUser.id,
      extras.staffUser.id,
      cast.teacherUser.id,
    ]);
    // Both expense rows this run wrote: the settled salary row (soft-deleted)
    // and the manual bystander row. Remove them before the carryover below.
    await db.delete(expenses).where(inArray(expenses.id, [settledExpenseId, manualExpenseId]));
    await db.delete(expenses).where(eq(expenses.sourceEntityId, carryoverId));
    // Carryover rows (items cascade) before the teacher they RESTRICT to.
    await db.delete(carryoverBalances).where(eq(carryoverBalances.teacherId, cast.teacher.id));
    // The journey's own audited sessions and their transition events are
    // outside the shared cast's tracked instance list; remove both here so
    // the cast teardown below sees no dangling event rows.
    const auditedInstanceIds = [firstInstance.id, secondInstance.id];
    await db.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, auditedInstanceIds));
    await db.delete(classInstances).where(inArray(classInstances.id, auditedInstanceIds));
    await cleanupExpenseJourneyExtras(extras);
    await cleanupPayrollJourneyCast(cast);
  });

  function sessionIds(): string[] {
    return [fixture.firstInstance.id, fixture.secondInstance.id];
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
    carryoverId = group?.carryoverId ?? "";
    expect(carryoverId.length).toBeGreaterThan(0);

    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(false);
    expect(carryover.paid).toBe(ZERO_PAID);
    expect(carryover.expenseId).toBeNull();
  });

  test("step 2 — operator creates a manual bystander expense for the bulk-delete rollback check", async () => {
    const manual = await ExpenseService.create(
      {
        title: `${PREFIX} manual utility bill`,
        type: ExpenseType.MARKETING,
        expenseValue: MANUAL_EXPENSE_VALUE,
        expenseCurrency: CurrencyCode.SAR,
        paymentDate: "2026-09-06",
        expenseDate: MANUAL_EXPENSE_MONTH,
        note: `${PREFIX} manual note`,
        createdByUserId: fixture.cast.operatorUser.id,
      },
      fixture.cast.operatorUser.id,
      tErrors
    );
    manualExpenseId = manual.id;
    expect(manual.deletedAt).toBeNull();
    expect(manual.createdByUserId).toBe(fixture.cast.operatorUser.id);
    expect(manual.sourceEntity).toBeNull();

    // Cross-actor visibility: the view-only auditor reads the manual row via
    // the default (non-deleted) ledger view.
    const viewerPage = await ExpenseService.getReport(
      fixture.extras.viewerUser.id,
      { title: PREFIX },
      { limit: 10, offset: 0 },
      tErrors
    );
    const viewerRow = viewerPage.rows.find(row => row.id === manualExpenseId);
    expect(viewerRow?.expenseValue).toBe(MANUAL_EXPENSE_VALUE);

    // Side effect: exactly one create audit row attributed to the operator.
    const auditRows = await readExpenseAuditRows(manualExpenseId);
    expect(auditRows.map(row => row.action)).toEqual([EXPENSE_CREATE_ACTION]);
    expect(auditRows[0]?.actorUserId).toBe(fixture.cast.operatorUser.id);
  });

  test("step 3 — operator settles the carryover to expense: paid carryover and a provenance-linked ledger row", async () => {
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
    settledExpenseId = item?.expenseId ?? "";
    expect(settledExpenseId.length).toBeGreaterThan(0);

    // The settlement landed a real ledger row provenance-linked to the
    // carryover — the row that the later steps must protect and unpay.
    const expense = await readExpenseRow(settledExpenseId);
    expect(expense.type).toBe(ExpenseType.SALARIES);
    expect(expense.expenseValue).toBe(AGGREGATE_PAYABLE);
    expect(expense.expenseCurrency).toBe(CurrencyCode.SAR);
    expect(expense.paymentDate).toBe(PAYMENT_DATE);
    expect(expense.sourceEntity).toBe(EXPENSE_SOURCE_CARRYOVER);
    expect(expense.sourceEntityId).toBe(carryoverId);
    expect(expense.deletedAt).toBeNull();

    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(true);
    expect(carryover.paid).toBe(AGGREGATE_PAYABLE);
    expect(carryover.expenseId).toBe(settledExpenseId);

    // Cross-actor visibility: the salary row joins the manual one on the
    // default ledger view (the payment-date window isolates the payout;
    // membership by id keeps the assertion safe under concurrent suites).
    const viewerPage = await ExpenseService.getReport(
      fixture.extras.viewerUser.id,
      { paymentDateFrom: PAYMENT_DATE, paymentDateTo: PAYMENT_DATE },
      { limit: 50, offset: 0 },
      tErrors
    );
    const settledRow = viewerPage.rows.find(row => row.id === settledExpenseId);
    expect(settledRow).toBeDefined();

    // Side effect: exactly one create audit row for the settled expense so far.
    const auditRows = await readExpenseAuditRows(settledExpenseId);
    expect(auditRows.map(row => row.action)).toEqual([EXPENSE_CREATE_ACTION]);
  });

  test("step 4 — direct delete of the protected settlement row rejects EXPENSE_DELETE_VIA_UNPAY", async () => {
    // While the carryover is paid its linked salary expense is protected: the
    // UI delete entry point must redirect the operator to the Unpay flow.
    const deleteError = await expectJourneyError(() =>
      ExpenseService.softDelete(
        {
          id: settledExpenseId,
          actorUserId: fixture.cast.operatorUser.id,
          reason: `${PREFIX} direct delete attempt`,
        },
        tErrors
      )
    );
    expect(deleteError.message).toContain(tErrors.expenses.deleteViaUnpay);

    // The rejection left the row untouched and wrote no delete audit row.
    const untouched = await readExpenseRow(settledExpenseId);
    expect(untouched.deletedAt).toBeNull();
    expect(
      (await readExpenseAuditRows(settledExpenseId)).filter(row => row.action === EXPENSE_DELETE_ACTION)
    ).toHaveLength(0);
  });

  test("step 5 — bulk delete with a protected member rolls back atomically", async () => {
    // The manual bystander leads the batch so its write happens before the
    // protected member rejects: only a real rollback leaves it alive.
    const bulkError = await expectJourneyError(() =>
      ExpenseService.bulkDelete(
        {
          ids: [manualExpenseId, settledExpenseId],
          actorUserId: fixture.cast.operatorUser.id,
          reason: `${PREFIX} bulk attempt`,
        },
        tErrors
      )
    );
    expect(bulkError.message).toContain(tErrors.expenses.deleteViaUnpay);

    // Atomic rollback: the bystander manual row is still live with no delete
    // audit row, and the protected row is equally untouched.
    const manual = await readExpenseRow(manualExpenseId);
    expect(manual.deletedAt).toBeNull();
    expect(
      (await readExpenseAuditRows(manualExpenseId)).filter(row => row.action === EXPENSE_DELETE_ACTION)
    ).toHaveLength(0);
    const protectedRow = await readExpenseRow(settledExpenseId);
    expect(protectedRow.deletedAt).toBeNull();
    expect(
      (await readExpenseAuditRows(settledExpenseId)).filter(row => row.action === EXPENSE_DELETE_ACTION)
    ).toHaveLength(0);
  });

  test("step 6 — unpay soft-deletes the linked expense atomically and the ledger view splits by includeDeleted", async () => {
    const unpaid = await CarryoverBalanceService.unpayCarryoverBalance(
      { id: carryoverId, note: unpayNote, actorUserId: fixture.cast.operatorUser.id },
      tErrors
    );
    expect(unpaid.isPaid).toBe(false);
    expect(unpaid.expenseId).toBeNull();

    // The committed carryover row reverted in the same transaction that
    // soft-deleted the expense — the paired read below is what makes the
    // atomicity observable.
    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(false);
    expect(carryover.paid).toBe(ZERO_PAID);

    // Atomic paired write: the expense carries deletedAt, the deleting actor,
    // and the unpay note — never a hard delete.
    const deleted = await readExpenseRow(settledExpenseId);
    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.deletedByUserId).toBe(fixture.cast.operatorUser.id);
    expect(deleted.deletedReason).toBe(unpayNote);
    expenseDeletedAt = deleted.deletedAt;

    // Default ledger view hides the soft-deleted row entirely.
    const defaultPage = await ExpenseService.getReport(
      fixture.extras.viewerUser.id,
      { paymentDateFrom: PAYMENT_DATE, paymentDateTo: PAYMENT_DATE },
      { limit: 50, offset: 0 },
      tErrors
    );
    expect(defaultPage.rows.find(row => row.id === settledExpenseId)).toBeUndefined();

    // The includeDeleted view keeps the row visible with its deletion marker —
    // the strike-through surface the UI renders.
    const withDeletedPage = await ExpenseService.getReport(
      fixture.extras.viewerUser.id,
      { paymentDateFrom: PAYMENT_DATE, paymentDateTo: PAYMENT_DATE, includeDeleted: true },
      { limit: 50, offset: 0 },
      tErrors
    );
    const struckRow = withDeletedPage.rows.find(row => row.id === settledExpenseId);
    expect(struckRow).toBeDefined();
    expect(struckRow?.deletedAt).not.toBeNull();
    expect(struckRow?.deletedReason).toBe(unpayNote);

    // Side effect: exactly one EXPENSE_DELETE audit row, attributed to the
    // operator, with the unpay note as its reason.
    const deleteAuditRows = (await readExpenseAuditRows(settledExpenseId)).filter(
      row => row.action === EXPENSE_DELETE_ACTION
    );
    expect(deleteAuditRows).toHaveLength(1);
    expect(deleteAuditRows[0]?.actorUserId).toBe(fixture.cast.operatorUser.id);
    expect(isRecord(deleteAuditRows[0]?.metadata)).toBe(true);
    const deleteMetadata = isRecord(deleteAuditRows[0]?.metadata) ? deleteAuditRows[0]?.metadata : {};
    expect(deleteMetadata.reason).toBe(unpayNote);

    // The bystander manual row survives the reversal untouched.
    const manual = await readExpenseRow(manualExpenseId);
    expect(manual.deletedAt).toBeNull();
  });

  test("step 7 — denial paths: double unpay rejects, non-manage actors cannot touch the ledger flow", async () => {
    // Double-reversal is impossible: reverting the already-unpaid carryover
    // rejects before any state is touched.
    const reUnpayError = await expectJourneyError(() =>
      CarryoverBalanceService.unpayCarryoverBalance(
        { id: carryoverId, actorUserId: fixture.cast.operatorUser.id },
        tErrors
      )
    );
    expect(reUnpayError.message).toContain(tErrors.carryover.notPaid);

    // The view-only auditor and the staff actor hold no manage grants — the
    // denials resolve through their real group memberships on both surfaces.
    const viewerUnpayDenied = await expectJourneyError(() =>
      CarryoverBalanceService.unpayCarryoverBalance(
        { id: carryoverId, actorUserId: fixture.extras.viewerUser.id },
        tErrors
      )
    );
    expect(viewerUnpayDenied).toBeInstanceOf(ForbiddenError);
    expect(viewerUnpayDenied.message).toContain(tErrors.insufficientPermissions);

    const staffUnpayDenied = await expectJourneyError(() =>
      CarryoverBalanceService.unpayCarryoverBalance(
        { id: carryoverId, actorUserId: fixture.extras.staffUser.id },
        tErrors
      )
    );
    expect(staffUnpayDenied).toBeInstanceOf(ForbiddenError);
    expect(staffUnpayDenied.message).toContain(tErrors.insufficientPermissions);

    const viewerDeleteDenied = await expectJourneyError(() =>
      ExpenseService.softDelete({ id: manualExpenseId, actorUserId: fixture.extras.viewerUser.id }, tErrors)
    );
    expect(viewerDeleteDenied).toBeInstanceOf(ForbiddenError);
    expect(viewerDeleteDenied.message).toContain(tErrors.insufficientPermissions);

    const staffBulkDenied = await expectJourneyError(() =>
      ExpenseService.bulkDelete({ ids: [manualExpenseId], actorUserId: fixture.extras.staffUser.id }, tErrors)
    );
    expect(staffBulkDenied).toBeInstanceOf(ForbiddenError);
    expect(staffBulkDenied.message).toContain(tErrors.insufficientPermissions);

    // The teacher is fully outside the expense ledger — even the view read
    // denies them.
    const teacherReadDenied = await expectJourneyError(() =>
      ExpenseService.getReport(
        fixture.cast.teacherUser.id,
        { paymentDateFrom: PAYMENT_DATE, paymentDateTo: PAYMENT_DATE },
        { limit: 10, offset: 0 },
        tErrors
      )
    );
    expect(teacherReadDenied).toBeInstanceOf(ForbiddenError);
    expect(teacherReadDenied.message).toContain(tErrors.insufficientPermissions);

    // Every rejection left the reverted state untouched — including the
    // soft-deleted expense: `deletedAt` is unchanged and there is still
    // exactly one EXPENSE_DELETE audit row (the reversal settles
    // idempotently; no duplicate write, no duplicate audit).
    const carryover = await readCarryoverRow(carryoverId);
    expect(carryover.isPaid).toBe(false);
    expect(carryover.expenseId).toBeNull();
    const untouchedExpense = await readExpenseRow(settledExpenseId);
    expect(untouchedExpense.deletedAt?.getTime()).toBe(expenseDeletedAt?.getTime());
    expect(untouchedExpense.deletedReason).toBe(unpayNote);
    expect(
      (await readExpenseAuditRows(settledExpenseId)).filter(row => row.action === EXPENSE_DELETE_ACTION)
    ).toHaveLength(1);
    const manual = await readExpenseRow(manualExpenseId);
    expect(manual.deletedAt).toBeNull();
  });

  test("step 8 — no notification fan-out and the ledger audit trails hold exactly this run's actions", async () => {
    // Neither the carryover settlement flows nor the ledger mutations dispatch
    // any notifications.
    expect(dispatchSpy.mock.calls).toHaveLength(0);

    // The append-only ledger audit trail for the settled expense is exactly
    // create-then-delete; the manual bystander carries only its create row.
    const settledActions = sortStrings((await readExpenseAuditRows(settledExpenseId)).map(row => row.action));
    expect(settledActions).toEqual(sortStrings([EXPENSE_CREATE_ACTION, EXPENSE_DELETE_ACTION]));
    const manualActions = (await readExpenseAuditRows(manualExpenseId)).map(row => row.action);
    expect(manualActions).toEqual([EXPENSE_CREATE_ACTION]);

    // The carryover trail ends with the unpaid reversal.
    const carryoverActions = (
      await db.select({ action: auditLogs.action }).from(auditLogs).where(eq(auditLogs.entityId, carryoverId))
    ).map(row => row.action);
    expect(carryoverActions).toContain(CARRYOVER_UNPAID_ACTION);
  });
});
