import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, carryoverBalances, classInstances, classStatusEvents } from "@/backend/db/schema";
import { NotificationEventType } from "@/backend/enum";
import { CalculationStatus } from "@/backend/enum/teachers/payroll-calculation.enum";
import { ForbiddenError } from "@/backend/lib";
import { CarryoverBalanceService } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import type { BulkToExpenseResult, CarryoverBalanceSelectType, ClassInstanceSelectType } from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type CarryoverExpenseCastExtras,
  cleanupCarryoverExpenseExtras,
  cleanupPayrollJourneyCast,
  type DispatchSpy,
  expectJourneyError,
  type PayrollJourneyCast,
  provisionCarryoverExpenseExtras,
  provisionPayrollJourneyCast,
  waitForEventDispatchToUser,
} from "@/test/workflows/helpers";

/** Audit trail discriminators — plain varchar columns, no TypeScript enums on the tables. */
const TRANSITION_EVENT_TYPE = "PAYROLL_STATUS_TRANSITION";
const CARRYOVER_AUDIT_ENTITY_TYPE = "CARRYOVER_BALANCE";
const CARRYOVER_ACTION_CREATE = "CARRYOVER_CREATE";
const CARRYOVER_ACTION_TO_EXPENSE = "CARRYOVER_TO_EXPENSE";

/** Hourly rate SAR 120 × a 60-minute session; both cast sessions settle at this amount. */
const SESSION_PAY = "120.00";
/** Two audited sessions aggregated into one carryover. */
const CARRYOVER_PAYABLE = "240.00";

/** Reads the live class-instance row so assertions run against committed state, not service return values. */
async function readInstance(classInstanceId: string): Promise<ClassInstanceSelectType> {
  const [row] = await db.select().from(classInstances).where(eq(classInstances.id, classInstanceId)).limit(1);
  if (!row) {
    throw new Error(`class instance ${classInstanceId} disappeared before it could be read`);
  }
  return row;
}

/** Reads the live carryover row so assertions run against committed state. */
async function readCarryoverRow(carryoverId: string): Promise<CarryoverBalanceSelectType> {
  const [row] = await db.select().from(carryoverBalances).where(eq(carryoverBalances.id, carryoverId)).limit(1);
  if (!row) {
    throw new Error(`carryover balance ${carryoverId} disappeared before it could be read`);
  }
  return row;
}

interface CarryoverAuditRow {
  action: string;
  entityType: string;
  metadata: unknown;
}

/** Raw audit rows for one carryover — actor attribution and payload live on the table, not the service surface. */
async function readCarryoverAuditRows(carryoverId: string): Promise<CarryoverAuditRow[]> {
  return db
    .select({
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, CARRYOVER_AUDIT_ENTITY_TYPE), eq(auditLogs.entityId, carryoverId)));
}

/** The conversion payload persisted in the settlement audit row's metadata. */
interface SettlementAuditMetadata {
  expenseId: string;
  paymentDate: string;
  expenseDate: string;
  amount: string;
  currency: string;
}

/** Structural guard — audit metadata is jsonb and arrives loosely typed, never trust it blind. */
function isSettlementAuditMetadata(value: unknown): value is SettlementAuditMetadata {
  if (typeof value !== "object" || value === null) return false;
  if (!("expenseId" in value) || !("paymentDate" in value) || !("expenseDate" in value)) return false;
  if (!("amount" in value) || !("currency" in value)) return false;
  return (
    typeof value.expenseId === "string" &&
    typeof value.paymentDate === "string" &&
    typeof value.expenseDate === "string" &&
    typeof value.amount === "string" &&
    typeof value.currency === "string"
  );
}

interface SessionEventRow {
  eventType: string;
  actorUserId: string | null;
  description: string | null;
}

/** Raw status-event rows for one session, in any order. */
async function readSessionEvents(classInstanceId: string): Promise<SessionEventRow[]> {
  return db
    .select({
      eventType: classStatusEvents.eventType,
      actorUserId: classStatusEvents.actorUserId,
      description: classStatusEvents.description,
    })
    .from(classStatusEvents)
    .where(eq(classStatusEvents.classInstanceId, classInstanceId));
}

/**
 * Cross-actor to-expense settlement journey: the teacher drives attendance
 * telemetry so both sessions land CALCULATED, the accounting operator
 * aggregates them into one carryover (sessions WAITING_PAID, linked to the
 * carryover), then converts the carryover into an expense settlement
 * (isPaid + sessions PAID + one CARRYOVER_TO_EXPENSE audit row carrying the
 * expense reference). A same-payload re-submit replays the first result with
 * no ledger growth, a second operator's settle attempt on the paid carryover
 * is denied as already-paid, and the read-only auditor sees the settled row
 * and its sessions while remaining locked out of the settle surface.
 *
 * The expense ledger itself is not yet provisioned by any module: the
 * settlement adapter returns a reference id and the full payload persists in
 * the conversion audit metadata, so this journey asserts the carryover state,
 * the audit rows, and the session statuses — never expense-table rows.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Carryover to-expense settlement journey (audited sessions → carryover → paid via expense)", () => {
  const PREFIX = `jrn_cexp_${randomUUID().slice(0, 8)}`;
  // The settlement instruction captured once so the idempotent re-submit
  // re-derives the exact same key (actor + payment date + expense month + note
  // + carryover ids).
  const SETTLE_NOTE = `${PREFIX} settlement note`;
  const PAYMENT_DATE = new Date().toISOString().slice(0, 10);
  const EXPENSE_DATE = PAYMENT_DATE.slice(0, 7);

  let tErrors: ErrorsLabels;
  let cast: PayrollJourneyCast;
  let extras: CarryoverExpenseCastExtras;
  let dispatchSpy: DispatchSpy;
  let carryoverId = "";
  let firstSettlement: BulkToExpenseResult;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for ALL notifications the lifecycle steps fan out
    // (class completion); the carryover surfaces themselves dispatch nothing.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionPayrollJourneyCast(PREFIX);
    extras = await provisionCarryoverExpenseExtras(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    // carryover_balances references the cast teacher with ON DELETE RESTRICT,
    // so this run's carryover rows (items cascade; session links set NULL on
    // delete) go before the cast cleanup deletes the teacher.
    await db.delete(carryoverBalances).where(eq(carryoverBalances.teacherId, cast.teacher.id));
    // Settlement mirrors into append-only audit_logs rows referencing these
    // actors; the immutability trigger must be lifted for the sweep (same
    // precedent as the payroll settlement journey). INSERT traffic from
    // concurrent suites is unaffected while the trigger is off.
    await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
    try {
      await db
        .delete(auditLogs)
        .where(
          inArray(auditLogs.actorUserId, [
            cast.operatorUser.id,
            cast.teacherUser.id,
            cast.parentUser.id,
            cast.student.userId,
            extras.secondOperatorUser.id,
            extras.viewerUser.id,
          ])
        );
      await cleanupCarryoverExpenseExtras(extras);
      await cleanupPayrollJourneyCast(cast);
    } finally {
      await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
    }
  });

  /** Builds the settle call payload; identical arguments reconstruct the idempotency key. */
  function buildSettleInput(actorUserId: string): {
    carryoverIds: readonly string[];
    paymentDate: string;
    expenseDate: string;
    note: string;
    actorUserId: string;
  } {
    return {
      carryoverIds: [carryoverId],
      paymentDate: PAYMENT_DATE,
      expenseDate: EXPENSE_DATE,
      note: SETTLE_NOTE,
      actorUserId,
    };
  }

  /** The two sessions aggregated into this journey's carryover. */
  function settlementSessionIds(): string[] {
    return [cast.onTimeInstance.id, cast.studentAbsentInstance.id];
  }

  /** Runs `check` against every settlement session in parallel (oxlint no-await-in-loop). */
  async function forEachSettlementSession(check: (instanceId: string) => Promise<void>): Promise<void> {
    await Promise.all(settlementSessionIds().map(instanceId => check(instanceId)));
  }

  test("step 1 — teacher telemetry and the operator's terminal stop audit the on-time session", async () => {
    await ClassSessionService.activate(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    await ClassSessionService.updateStatusStart(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);

    const completed = await ClassSessionService.stop(cast.operatorUser.id, cast.onTimeInstance.id, tErrors);
    expect(completed?.executionState).toBe(ClassExecutionState.COMPLETED);

    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row.teacherPaidAmount).toBe(SESSION_PAY);
    expect(row.teacherPaidCurrency).toBe(CurrencyCode.SAR);

    // The completion fan-out reaches the teacher through the intercepted
    // dispatch boundary; once it lands the spy is cleared so later steps see
    // only their own traffic.
    expect(
      await waitForEventDispatchToUser(dispatchSpy, NotificationEventType.CLASS_COMPLETED, cast.teacherUser.id)
    ).toBe(true);
    dispatchSpy.mockClear();
  });

  test("step 2 — operator resolves the never-joined session as student-absent at full pay", async () => {
    await ClassSessionService.activateOverride(cast.operatorUser.id, cast.studentAbsentInstance.id, tErrors);
    const absent = await ClassSessionService.updateStatusAbsent(
      cast.operatorUser.id,
      cast.studentAbsentInstance.id,
      tErrors
    );
    expect(absent?.executionState).toBe(ClassExecutionState.COMPLETED);

    const row = await readInstance(cast.studentAbsentInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row.teacherPaidAmount).toBe(SESSION_PAY);
  });

  test("step 3 — bulk carryover aggregates both audited sessions and moves them to WAITING_PAID", async () => {
    const created = await CarryoverBalanceService.bulkCreateCarryoverBalances(
      {
        instanceIds: [cast.onTimeInstance.id, cast.studentAbsentInstance.id],
        actorUserId: cast.operatorUser.id,
        note: `${PREFIX} aggregate`,
      },
      tErrors
    );

    // Both sessions belong to the same teacher and currency, so they group
    // into exactly one carryover priced from the session snapshots.
    expect(created.groups).toHaveLength(1);
    const group = created.groups[0];
    expect(group?.teacherId).toBe(cast.teacher.id);
    expect(group?.payable).toBe(CARRYOVER_PAYABLE);
    expect(group?.currency).toBe(CurrencyCode.SAR);
    expect(group?.instanceIds).toHaveLength(2);
    if (!group) {
      throw new Error("carryover group missing from the bulk-create result");
    }
    carryoverId = group.carryoverId;

    await forEachSettlementSession(async instanceId => {
      const row = await readInstance(instanceId);
      expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
      expect(row.carryoverBalanceId).toBe(carryoverId);
    });

    // One CARRYOVER_CREATE audit row per created carryover, shared with the
    // service result.
    const auditRows = await readCarryoverAuditRows(carryoverId);
    expect(auditRows.filter(row => row.action === CARRYOVER_ACTION_CREATE)).toHaveLength(1);
    expect(created.auditLogIds).toHaveLength(1);
  });

  test("step 4 — bulk to-expense settles the carryover: isPaid, sessions PAID, conversion audit row", async () => {
    // Step 2's absence resolution fans out asynchronously; clear it so this
    // step's call log reflects only the settle path.
    dispatchSpy.mockClear();
    const settled = await CarryoverBalanceService.bulkCarryoverToExpense(
      buildSettleInput(cast.operatorUser.id),
      tErrors
    );
    firstSettlement = settled;

    expect(settled.items).toHaveLength(1);
    const item = settled.items[0];
    expect(item?.carryoverId).toBe(carryoverId);
    expect(item?.amount).toBe(CARRYOVER_PAYABLE);
    expect(item?.currency).toBe(CurrencyCode.SAR);
    expect(item?.expenseId.length).toBeGreaterThan(0);
    expect(settled.auditLogIds).toHaveLength(1);

    // Committed carryover row: paid in full, stamped with the payout date, the
    // expense reference, and the settling operator.
    const row = await readCarryoverRow(carryoverId);
    expect(row.isPaid).toBe(true);
    expect(row.paid).toBe(CARRYOVER_PAYABLE);
    expect(row.payable).toBe(CARRYOVER_PAYABLE);
    expect(row.paymentDate).toBe(PAYMENT_DATE);
    expect(row.expenseId).toBe(item?.expenseId);
    expect(row.paidByUserId).toBe(cast.operatorUser.id);
    expect(row.paidAt).not.toBeNull();

    // Same-transaction guarantee: every linked session flipped to PAID with
    // its payable amount untouched and the carryover link preserved.
    await forEachSettlementSession(async instanceId => {
      const instance = await readInstance(instanceId);
      expect(instance.calculationStatus).toBe(CalculationStatus.PAID);
      expect(instance.teacherPaidAmount).toBe(SESSION_PAY);
      expect(instance.carryoverBalanceId).toBe(carryoverId);
    });

    // Side effect: exactly one CARRYOVER_TO_EXPENSE audit row carries the full
    // settlement payload (the expense-ledger adapter persists no rows of its
    // own; this metadata is the audit surface of the conversion).
    const conversionRows = (await readCarryoverAuditRows(carryoverId)).filter(
      auditRow => auditRow.action === CARRYOVER_ACTION_TO_EXPENSE
    );
    expect(conversionRows).toHaveLength(1);
    const metadata = conversionRows[0]?.metadata;
    if (!isSettlementAuditMetadata(metadata)) {
      throw new Error("conversion audit row metadata is missing the settlement payload");
    }
    expect(metadata.expenseId).toBe(item?.expenseId);
    expect(metadata.paymentDate).toBe(PAYMENT_DATE);
    expect(metadata.expenseDate).toBe(EXPENSE_DATE);
    expect(metadata.amount).toBe(CARRYOVER_PAYABLE);
    expect(metadata.currency).toBe(CurrencyCode.SAR);

    // Per-session settlement events, attributed to the operator.
    await forEachSettlementSession(async instanceId => {
      const events = await readSessionEvents(instanceId);
      const settleEvents = events.filter(event => event.description === `Settled via expense ${item?.expenseId}`);
      expect(settleEvents).toHaveLength(1);
      expect(settleEvents[0]?.eventType).toBe(TRANSITION_EVENT_TYPE);
      expect(settleEvents[0]?.actorUserId).toBe(cast.operatorUser.id);
    });

    // The settlement surfaces dispatch no notifications.
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });

  test("step 5 — view-only auditor reads the paid row and its drill-down sessions; a permissionless actor sees nothing", async () => {
    const page = await CarryoverBalanceService.getReport(
      extras.viewerUser.id,
      { teacherId: cast.teacher.id, paidStatus: "Paid" },
      { limit: 10, offset: 0 },
      tErrors
    );
    const rows = page.rows.filter(row => row.id === carryoverId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isPaid).toBe(true);
    expect(rows[0]?.paid).toBe(CARRYOVER_PAYABLE);
    expect(rows[0]?.expenseId).not.toBeNull();
    expect(rows[0]?.paymentDate).toBe(PAYMENT_DATE);

    const sessions = await CarryoverBalanceService.getLinkedSessions(extras.viewerUser.id, carryoverId, tErrors);
    expect(sessions).toHaveLength(2);
    for (const session of sessions) {
      expect(session.currentStatus).toBe(CalculationStatus.PAID);
      expect(session.originalStatus).toBe(CalculationStatus.CALCULATED);
      expect(session.originalAmount).toBe(SESSION_PAY);
    }

    // The parent holds no carryover grants: the read surface denies before any
    // row is returned.
    const denied = await expectJourneyError(() =>
      CarryoverBalanceService.getReport(cast.parentUser.id, {}, { limit: 10, offset: 0 }, tErrors)
    );
    expect(denied).toBeInstanceOf(ForbiddenError);
    expect(denied.message).toContain(tErrors.insufficientPermissions);
  });

  test("step 6 — same-payload re-submit replays the first settlement with no ledger or audit growth", async () => {
    const replay = await CarryoverBalanceService.bulkCarryoverToExpense(
      buildSettleInput(cast.operatorUser.id),
      tErrors
    );

    // The replayed result is byte-identical: same expense reference, same
    // audit row ids — the second call never touched the write path.
    expect(replay).toEqual(firstSettlement);

    const auditRows = await readCarryoverAuditRows(carryoverId);
    expect(auditRows.filter(row => row.action === CARRYOVER_ACTION_CREATE)).toHaveLength(1);
    expect(auditRows.filter(row => row.action === CARRYOVER_ACTION_TO_EXPENSE)).toHaveLength(1);

    // State is exactly where the first settlement left it.
    const row = await readCarryoverRow(carryoverId);
    expect(row.isPaid).toBe(true);
    expect(row.paid).toBe(CARRYOVER_PAYABLE);
    expect(row.expenseId).toBe(firstSettlement.items[0]?.expenseId);

    await forEachSettlementSession(async instanceId => {
      const events = await readSessionEvents(instanceId);
      const settleEvents = events.filter(
        event => event.description === `Settled via expense ${firstSettlement.items[0]?.expenseId}`
      );
      expect(settleEvents).toHaveLength(1);
      const instance = await readInstance(instanceId);
      expect(instance.calculationStatus).toBe(CalculationStatus.PAID);
    });
  });

  test("step 7 — denials: a concurrent operator hits already-paid; the auditor cannot settle", async () => {
    // A second full operator re-derives a different idempotency key (the actor
    // is part of the key), so the concurrent settle attempt reaches the
    // paid-state guard instead of replaying.
    const concurrent = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCarryoverToExpense(buildSettleInput(extras.secondOperatorUser.id), tErrors)
    );
    expect(concurrent.message).toContain(tErrors.carryover.alreadyPaid);

    // VIEW grants reads, never writes: the auditor is rejected at the
    // permission gate before the settle surface evaluates state.
    const viewerDenied = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCarryoverToExpense(buildSettleInput(extras.viewerUser.id), tErrors)
    );
    expect(viewerDenied).toBeInstanceOf(ForbiddenError);
    expect(viewerDenied.message).toContain(tErrors.insufficientPermissions);

    // Rejected attempts wrote nothing: the settled row, the audit trail, and
    // the sessions are untouched by either denial.
    const row = await readCarryoverRow(carryoverId);
    expect(row.isPaid).toBe(true);
    expect(row.expenseId).toBe(firstSettlement.items[0]?.expenseId);
    expect(row.paidByUserId).toBe(cast.operatorUser.id);

    const auditRows = await readCarryoverAuditRows(carryoverId);
    expect(auditRows.filter(auditRow => auditRow.action === CARRYOVER_ACTION_TO_EXPENSE)).toHaveLength(1);
  });
});
