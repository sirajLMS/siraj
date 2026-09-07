import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, carryoverBalances, classInstances, expenses, users } from "@/backend/db/schema";
import { AccountStatus, CalculationStatus, ExpenseType } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib";
import { CarryoverBalanceService, ExpenseService } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { CarryoverBalanceSelectType, ClassInstanceSelectType, ExpenseSelectType } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type CarryoverCreateCast,
  type CarryoverExpenseCastExtras,
  cleanupCarryoverCreateCast,
  cleanupCarryoverExpenseExtras,
  cleanupExpenseViewerExtras,
  type DispatchSpy,
  type ExpenseViewerCastExtras,
  expectJourneyError,
  provisionCarryoverCreateCast,
  provisionCarryoverExpenseExtras,
  provisionExpenseViewerExtras,
} from "@/test/workflows/helpers";

/** Audit trail discriminator for the carryover settlement conversion rows. */
const CARRYOVER_AUDIT_ENTITY_TYPE = "CARRYOVER_BALANCE";
const CARRYOVER_ACTION_TO_EXPENSE = "CARRYOVER_TO_EXPENSE";
/** Ledger provenance marker the settlement writes onto its expense rows. */
const EXPENSE_SOURCE_CARRYOVER = "carryover_balances";

/** Teacher A aggregates 120.00 + 180.00 SAR across 60 + 90 minutes; teacher B one 60-minute session. */
const TEACHER_A_PAYABLE = "300.00";
const TEACHER_B_PAYABLE = "120.00";

const REPORT_PAGE = { limit: 50, offset: 0 };

/** Reads the live carryover row so assertions run against committed state, not service return values. */
async function readCarryoverRow(carryoverId: string): Promise<CarryoverBalanceSelectType> {
  const [row] = await db.select().from(carryoverBalances).where(eq(carryoverBalances.id, carryoverId)).limit(1);
  if (!row) {
    throw new Error(`carryover balance ${carryoverId} disappeared before it could be read`);
  }
  return row;
}

/** Reads the live class-instance row so assertions run against committed state. */
async function readInstance(classInstanceId: string): Promise<ClassInstanceSelectType> {
  const [row] = await db.select().from(classInstances).where(eq(classInstances.id, classInstanceId)).limit(1);
  if (!row) {
    throw new Error(`class instance ${classInstanceId} disappeared before it could be read`);
  }
  return row;
}

/** The real expense-ledger rows referencing one carryover, deleted rows included. */
async function readCarryoverExpenses(carryoverId: string): Promise<ExpenseSelectType[]> {
  return db
    .select()
    .from(expenses)
    .where(and(eq(expenses.sourceEntity, EXPENSE_SOURCE_CARRYOVER), eq(expenses.sourceEntityId, carryoverId)));
}

interface CarryoverAuditRow {
  action: string;
  entityType: string;
}

/** Raw audit rows for one carryover — actor attribution lives on the table, not the service surface. */
async function readCarryoverAuditRows(carryoverId: string): Promise<CarryoverAuditRow[]> {
  return db
    .select({ action: auditLogs.action, entityType: auditLogs.entityType })
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, CARRYOVER_AUDIT_ENTITY_TYPE), eq(auditLogs.entityId, carryoverId)));
}

/**
 * Pay-to-ledger journey: the accounting operator aggregates audited sessions
 * into two carryovers, settles teacher B's carryover into a Salaries expense,
 * then proves mixed-batch atomicity — a settle attempt spanning an unpaid and
 * an already-paid carryover fails with no orphan ledger row and no partial
 * state change on the unpaid side. Teacher A's carryover then settles onto the
 * ledger with full provenance, an ACCOUNTING_EXPENSES_VIEW auditor sees both
 * Salaries rows (while a carryover-only viewer and a permissionless parent do
 * not — one denial asserted in Arabic), and the expense row's teacherName
 * snapshot survives the teacher's rename and deactivation (E16/E20).
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own top-level transactions
 * over the global `db`, so fixtures are committed in beforeAll and hard-
 * deleted in afterAll via the cast helpers.
 */
describe("Carryover pay-to-expense-ledger journey (settlement → ledger row → viewer/auditor)", () => {
  const PREFIX = `jrn_xpled_${randomUUID().slice(0, 8)}`;
  const PAYMENT_DATE = new Date().toISOString().slice(0, 10);
  const EXPENSE_DATE = PAYMENT_DATE.slice(0, 7);

  let tErrors: ErrorsLabels;
  let tErrorsAr: ErrorsLabels;
  let cast: CarryoverCreateCast;
  let carryoverExtras: CarryoverExpenseCastExtras;
  let expenseViewer: ExpenseViewerCastExtras;
  let dispatchSpy: DispatchSpy;
  let carryoverAId = "";
  let carryoverBId = "";
  let expenseIdA = "";

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    tErrorsAr = getServerTranslations("ar").errorsTranslations;
    // Interception boundary for ALL notifications: the aggregation and
    // settlement surfaces dispatch nothing, so a live spy that sees any call
    // at all proves a channel would have been hit for real.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionCarryoverCreateCast(PREFIX);
    carryoverExtras = await provisionCarryoverExpenseExtras(PREFIX);
    expenseViewer = await provisionExpenseViewerExtras(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    // The settlements persisted real expense rows for this run's teachers;
    // they go first (their teacher_id FK is SET NULL, so the cast cleanup
    // would otherwise strand them as orphans).
    await db.delete(expenses).where(inArray(expenses.teacherId, [cast.teacherA.id, cast.teacherB.id]));
    // Committed audit rows reference this run's actors; the immutability
    // trigger must be lifted for the sweep (same precedent as the accounting
    // carryover journeys). INSERT traffic from concurrent suites is
    // unaffected while the trigger is off.
    await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
    try {
      await db
        .delete(auditLogs)
        .where(
          inArray(auditLogs.actorUserId, [
            cast.operatorUser.id,
            cast.teacherAUser.id,
            cast.teacherBUser.id,
            cast.parentUser.id,
            carryoverExtras.secondOperatorUser.id,
            carryoverExtras.viewerUser.id,
            expenseViewer.viewerUser.id,
          ])
        );
      await cleanupExpenseViewerExtras(expenseViewer);
      await cleanupCarryoverExpenseExtras(carryoverExtras);
      await cleanupCarryoverCreateCast(cast);
    } finally {
      await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
    }
  });

  /** Session ids aggregated under one teacher's carryover. */
  function instanceIdsForTeacher(teacherId: string): string[] {
    return cast.sessions.filter(session => session.teacherId === teacherId).map(session => session.instance.id);
  }

  /** Builds the settle call payload; identical arguments reconstruct the idempotency key. */
  function buildSettleInput(
    carryoverIds: readonly string[],
    note: string,
    actorUserId: string
  ): {
    carryoverIds: readonly string[];
    paymentDate: string;
    expenseDate: string;
    note: string;
    actorUserId: string;
  } {
    return { carryoverIds, paymentDate: PAYMENT_DATE, expenseDate: EXPENSE_DATE, note, actorUserId };
  }

  test("step 1 — bulk carryover aggregation stages both teachers' audited sessions as WAITING_PAID", async () => {
    const created = await CarryoverBalanceService.bulkCreateCarryoverBalances(
      {
        instanceIds: cast.sessions.map(session => session.instance.id),
        actorUserId: cast.operatorUser.id,
        note: `${PREFIX} aggregate`,
      },
      tErrors
    );

    expect(created.groups).toHaveLength(2);
    const groupA = created.groups.find(group => group.teacherId === cast.teacherA.id);
    const groupB = created.groups.find(group => group.teacherId === cast.teacherB.id);
    if (!groupA || !groupB) {
      throw new Error("bulk create did not return one carryover group per teacher");
    }
    expect(groupA.payable).toBe(TEACHER_A_PAYABLE);
    expect(groupB.payable).toBe(TEACHER_B_PAYABLE);
    expect(groupA.currency).toBe(CurrencyCode.SAR);
    carryoverAId = groupA.carryoverId;
    carryoverBId = groupB.carryoverId;

    await Promise.all(
      cast.sessions.map(async session => {
        const instance = await readInstance(session.instance.id);
        expect(instance.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
        const link = instance.carryoverBalanceId;
        expect(link === carryoverAId || link === carryoverBId).toBe(true);
      })
    );
  });

  test("step 2 — teacher B's carryover settles first: paid carryover + Salaries ledger row with provenance", async () => {
    const settled = await CarryoverBalanceService.bulkCarryoverToExpense(
      buildSettleInput([carryoverBId], `${PREFIX} settle teacher B`, cast.operatorUser.id),
      tErrors
    );

    expect(settled.items).toHaveLength(1);
    const item = settled.items[0];
    expect(item?.carryoverId).toBe(carryoverBId);
    expect(item?.amount).toBe(TEACHER_B_PAYABLE);
    expect(item?.expenseId.length).toBeGreaterThan(0);

    const row = await readCarryoverRow(carryoverBId);
    expect(row.isPaid).toBe(true);
    expect(row.expenseId).toBe(item?.expenseId);
    expect(row.paidByUserId).toBe(cast.operatorUser.id);

    // Greenfield check for the later atomicity step: the ledger row carries
    // the carryover-provenance and the teacher-name snapshot.
    const expenseRows = await readCarryoverExpenses(carryoverBId);
    expect(expenseRows).toHaveLength(1);
    expect(expenseRows[0]?.type).toBe(ExpenseType.SALARIES);
    expect(expenseRows[0]?.expenseValue).toBe(TEACHER_B_PAYABLE);
    expect(expenseRows[0]?.teacherName).toBe(cast.teacherBUser.name);
  });

  test("step 3 — a failing second carryover rolls the whole batch back: no orphan expense row for A", async () => {
    // The batch spans one unpaid (A) and one already-paid (B) carryover, so
    // it must reject — and the rejection must roll the whole transaction back,
    // leaving teacher A's carryover untouched and the ledger without orphans.
    const rejected = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCarryoverToExpense(
        buildSettleInput([carryoverAId, carryoverBId], `${PREFIX} mixed batch`, cast.operatorUser.id),
        tErrors
      )
    );
    expect(rejected.message).toContain(tErrors.carryover.alreadyPaid);

    const rowA = await readCarryoverRow(carryoverAId);
    expect(rowA.isPaid).toBe(false);
    expect(rowA.expenseId).toBeNull();
    expect(rowA.paidByUserId).toBeNull();
    expect(rowA.paidAt).toBeNull();

    await Promise.all(
      instanceIdsForTeacher(cast.teacherA.id).map(async instanceId => {
        const instance = await readInstance(instanceId);
        expect(instance.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
        expect(instance.carryoverBalanceId).toBe(carryoverAId);
      })
    );

    // No ledger write and no conversion audit row survived the rollback.
    expect(await readCarryoverExpenses(carryoverAId)).toHaveLength(0);
    const conversionRows = (await readCarryoverAuditRows(carryoverAId)).filter(
      auditRow => auditRow.action === CARRYOVER_ACTION_TO_EXPENSE
    );
    expect(conversionRows).toHaveLength(0);
  });

  test("step 4 — teacher A's carryover settles onto the ledger in one committed transaction", async () => {
    dispatchSpy.mockClear();
    const settled = await CarryoverBalanceService.bulkCarryoverToExpense(
      buildSettleInput([carryoverAId], `${PREFIX} settle teacher A`, cast.operatorUser.id),
      tErrors
    );

    expect(settled.items).toHaveLength(1);
    const item = settled.items[0];
    expect(item?.carryoverId).toBe(carryoverAId);
    expect(item?.amount).toBe(TEACHER_A_PAYABLE);
    expect(item?.currency).toBe(CurrencyCode.SAR);
    expect(item?.expenseId.length).toBeGreaterThan(0);
    if (!item) {
      throw new Error("settlement result missing the carryover-A item");
    }
    expenseIdA = item.expenseId;

    // Same-transaction guarantee: the carryover flipped paid with the expense
    // reference and the settled sessions moved to PAID — all committed.
    const row = await readCarryoverRow(carryoverAId);
    expect(row.isPaid).toBe(true);
    expect(row.paid).toBe(TEACHER_A_PAYABLE);
    expect(row.expenseId).toBe(expenseIdA);
    expect(row.paidByUserId).toBe(cast.operatorUser.id);
    expect(row.paymentDate).toBe(PAYMENT_DATE);

    await Promise.all(
      instanceIdsForTeacher(cast.teacherA.id).map(async instanceId => {
        const instance = await readInstance(instanceId);
        expect(instance.calculationStatus).toBe(CalculationStatus.PAID);
        expect(instance.carryoverBalanceId).toBe(carryoverAId);
      })
    );

    // The ledger row: Salaries, full payable, carryover provenance, operator
    // attribution, and the teacher-name snapshot.
    const expenseRows = await readCarryoverExpenses(carryoverAId);
    expect(expenseRows).toHaveLength(1);
    const expenseRow = expenseRows[0];
    if (!expenseRow) {
      throw new Error("the settlement wrote no expense row for carryover A");
    }
    expect(expenseRow.id).toBe(expenseIdA);
    expect(expenseRow.type).toBe(ExpenseType.SALARIES);
    expect(expenseRow.expenseValue).toBe(TEACHER_A_PAYABLE);
    expect(expenseRow.expenseCurrency).toBe(CurrencyCode.SAR);
    expect(expenseRow.paymentDate).toBe(PAYMENT_DATE);
    expect(expenseRow.expenseDate).toBe(EXPENSE_DATE);
    expect(expenseRow.teacherId).toBe(cast.teacherA.id);
    expect(expenseRow.teacherName).toBe(cast.teacherAUser.name);
    expect(expenseRow.sourceEntity).toBe(EXPENSE_SOURCE_CARRYOVER);
    expect(expenseRow.sourceEntityId).toBe(carryoverAId);
    expect(expenseRow.createdByUserId).toBe(cast.operatorUser.id);
    expect(expenseRow.deletedAt).toBeNull();

    const conversionRows = (await readCarryoverAuditRows(carryoverAId)).filter(
      auditRow => auditRow.action === CARRYOVER_ACTION_TO_EXPENSE
    );
    expect(conversionRows).toHaveLength(1);

    // The settlement surfaces dispatch no notifications.
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });

  test("step 5 — EXPENSES_VIEW audience sees both Salaries rows with provenance; others see the denial in their language", async () => {
    const page = await ExpenseService.getReport(
      expenseViewer.viewerUser.id,
      { expenseDate: EXPENSE_DATE },
      REPORT_PAGE,
      tErrors
    );
    const ours = page.rows.filter(row => row.sourceEntityId === carryoverAId || row.sourceEntityId === carryoverBId);
    expect(ours).toHaveLength(2);
    for (const row of ours) {
      expect(row.sourceEntity).toBe(EXPENSE_SOURCE_CARRYOVER);
      expect(row.type).toBe(ExpenseType.SALARIES);
      expect(row.expenseCurrency).toBe(CurrencyCode.SAR);
      expect(row.createdByUserId).toBe(cast.operatorUser.id);
    }
    expect(ours.find(row => row.sourceEntityId === carryoverAId)?.expenseValue).toBe(TEACHER_A_PAYABLE);
    expect(ours.find(row => row.sourceEntityId === carryoverBId)?.expenseValue).toBe(TEACHER_B_PAYABLE);

    // The carryover-only viewer holds no ledger grant: the read surface
    // rejects before any row is returned — ledger visibility needs its own
    // permission, not "any accounting view".
    const carryoverViewerDenied = await expectJourneyError(() =>
      ExpenseService.getReport(carryoverExtras.viewerUser.id, { expenseDate: EXPENSE_DATE }, REPORT_PAGE, tErrors)
    );
    expect(carryoverViewerDenied).toBeInstanceOf(ForbiddenError);
    expect(carryoverViewerDenied.message).toContain(tErrors.insufficientPermissions);

    // A permissionless actor gets the denial in their own locale — here the
    // Arabic-language error surface denies with the Arabic message.
    const arabicDenied = await expectJourneyError(() =>
      ExpenseService.getReport(cast.parentUser.id, { expenseDate: EXPENSE_DATE }, REPORT_PAGE, tErrorsAr)
    );
    expect(arabicDenied).toBeInstanceOf(ForbiddenError);
    expect(arabicDenied.message).toContain(tErrorsAr.insufficientPermissions);
  });

  test("step 6 — teacher rename + deactivation never disturbs the teacherName snapshot (E16/E20)", async () => {
    const snapshotName = cast.teacherAUser.name;
    const renamed = `${PREFIX} Teacher A Renamed`;
    // Deactivation + rename journey through the real users row; the expense
    // ledger must not cascade to the already-committed Salaries row.
    await db
      .update(users)
      .set({ name: renamed, status: AccountStatus.DEACTIVATED })
      .where(eq(users.id, cast.teacherAUser.id));

    const detail = await ExpenseService.getById(expenseViewer.viewerUser.id, expenseIdA, tErrors);
    expect(detail.teacherName).toBe(snapshotName);
    expect(detail.teacherName).not.toBe(renamed);
    expect(detail.teacherId).toBe(cast.teacherA.id);

    const page = await ExpenseService.getReport(
      expenseViewer.viewerUser.id,
      { expenseDate: EXPENSE_DATE },
      REPORT_PAGE,
      tErrors
    );
    const rowA = page.rows.find(row => row.id === expenseIdA);
    expect(rowA?.teacherName).toBe(snapshotName);

    // The committed row itself is untouched: no refresh, no nulling.
    const committed = await readCarryoverExpenses(carryoverAId);
    expect(committed).toHaveLength(1);
    expect(committed[0]?.teacherName).toBe(snapshotName);
    expect(committed[0]?.teacherId).toBe(cast.teacherA.id);
  });

  test("step 7 — the expense-viewer cannot settle: the permission gate rejects before state evaluation", async () => {
    const denied = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCarryoverToExpense(
        buildSettleInput([carryoverAId], `${PREFIX} viewer settle`, expenseViewer.viewerUser.id),
        tErrors
      )
    );
    expect(denied).toBeInstanceOf(ForbiddenError);
    expect(denied.message).toContain(tErrors.insufficientPermissions);

    // The denial touched nothing: one conversion audit row, one ledger row.
    const conversionRows = (await readCarryoverAuditRows(carryoverAId)).filter(
      auditRow => auditRow.action === CARRYOVER_ACTION_TO_EXPENSE
    );
    expect(conversionRows).toHaveLength(1);
    expect(await readCarryoverExpenses(carryoverAId)).toHaveLength(1);
  });
});
