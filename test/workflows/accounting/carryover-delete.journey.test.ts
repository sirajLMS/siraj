import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, carryoverBalanceItems, classInstances } from "@/backend/db/schema";
import { CalculationStatus } from "@/backend/enum";
import { DomainError, ForbiddenError, NotFoundError } from "@/backend/lib";
import { CarryoverBalanceService } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { CarryoverPage, CarryoverRow, ClassInstanceSelectType } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type CarryoverDeleteCast,
  cleanupCarryoverDeleteCast,
  type DispatchSpy,
  expectJourneyError,
  provisionCarryoverDeleteCast,
} from "@/test/workflows/helpers";

const REPORT_PAGE = { limit: 50, offset: 0 };

type AuditLogRow = typeof auditLogs.$inferSelect;

/** Reads the committed class-instance row so assertions never trust a service's return value. */
async function readRawSession(instanceId: string): Promise<ClassInstanceSelectType> {
  const [row] = await db.select().from(classInstances).where(eq(classInstances.id, instanceId)).limit(1);
  if (!row) {
    throw new Error(`class instance ${instanceId} disappeared mid-journey`);
  }
  return row;
}

/** The session still belongs to the carryover and sits in the expected calculation status. */
async function expectSessionLinkedTo(
  instanceId: string,
  carryoverId: string,
  status: CalculationStatus
): Promise<void> {
  const row = await readRawSession(instanceId);
  expect(row.carryoverBalanceId).toBe(carryoverId);
  expect(row.calculationStatus).toBe(status);
}

/** The delete flow detached the session and restored the status captured in its item snapshot. */
async function expectSessionRestored(
  instanceId: string,
  originalStatus: CalculationStatus,
  expectedPartialPercentage: number | null = null
): Promise<void> {
  const row = await readRawSession(instanceId);
  expect(row.carryoverBalanceId).toBeNull();
  expect(row.calculationStatus).toBe(originalStatus);
  expect(row.isPartialPercentage).toBe(expectedPartialPercentage);
}

/** Every audit row the journey wrote against one (possibly deleted) carryover. */
async function readCarryoverAuditRows(carryoverId: string): Promise<AuditLogRow[]> {
  return db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, "CARRYOVER_BALANCE"), eq(auditLogs.entityId, carryoverId)));
}

function auditActions(rows: readonly AuditLogRow[]): string[] {
  return rows.map(row => row.action);
}

/** Structured audit metadata; jsonb arrives as a plain object, anything else fails the step loudly. */
function auditMetadata(row: AuditLogRow | undefined): Record<string, unknown> {
  if (!row) {
    throw new Error("expected audit row is missing");
  }
  const { metadata } = row;
  if (typeof metadata !== "object" || metadata === null) {
    throw new Error("audit row is missing structured metadata");
  }
  return { ...metadata };
}

/**
 * Cross-actor journey: an accounting operator aggregates audited sessions into
 * carryovers, deletes one, and the linked sessions revert to their per-item
 * `originalStatus` snapshots and become selectable again for a second
 * operator — while the create/delete audit rows survive the deletion. The
 * paid-carryover delete guard holds for both the single and the bulk path,
 * the bulk path rolling the whole batch back when one row is paid, and a
 * view-only staff actor is denied before any row is touched.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own committed transactions,
 * so fixtures commit in beforeAll and are hard-deleted in afterAll via the
 * cast helpers.
 */
describe("Carryover delete journey (unlink + snapshot revert, audit survives, bulk atomicity)", () => {
  const PREFIX = `jrn_codel_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: CarryoverDeleteCast;
  let dispatchSpy: DispatchSpy;
  /** Teacher A's original carryover — deleted mid-journey. */
  let carryoverA = "";
  /** Teacher A's payable as settled by the bulk-create, asserted on the delete audit metadata. */
  let carryoverAPayable = "";
  /** Teacher B's carryover — settled to expense and then protected from deletion. */
  let carryoverB = "";
  /** Teacher A's re-created carryover, owned by the second operator. */
  let carryoverA2 = "";

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for any notification the journey might fan out;
    // the final step asserts the whole flow stays silent.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionCarryoverDeleteCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupCarryoverDeleteCast(cast);
  });

  async function readReportPage(actorUserId: string, teacherId: string): Promise<CarryoverPage> {
    return CarryoverBalanceService.getReport(actorUserId, { teacherId }, REPORT_PAGE, tErrors);
  }

  async function findCarryoverRow(
    actorUserId: string,
    teacherId: string,
    carryoverId: string
  ): Promise<CarryoverRow | null> {
    const page = await readReportPage(actorUserId, teacherId);
    return page.rows.find(row => row.id === carryoverId) ?? null;
  }

  test("step 1 — fixtures commit audited, unlinked sessions with per-item statuses", async () => {
    const aCalculated = await readRawSession(cast.aCalculatedInstance.id);
    const aPartial = await readRawSession(cast.aPartialInstance.id);
    const bFirst = await readRawSession(cast.bFirstInstance.id);
    const bSecond = await readRawSession(cast.bSecondInstance.id);

    expect(aCalculated.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(aPartial.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    expect(aPartial.isPartialPercentage).toBe(50);
    expect(bFirst.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(bSecond.calculationStatus).toBe(CalculationStatus.CALCULATED);
    for (const row of [aCalculated, aPartial, bFirst, bSecond]) {
      expect(row.carryoverBalanceId).toBeNull();
    }
  });

  test("step 2 — operator bulk-creates one carryover per teacher; sessions link and wait for settlement", async () => {
    const result = await CarryoverBalanceService.bulkCreateCarryoverBalances(
      {
        instanceIds: [
          cast.aCalculatedInstance.id,
          cast.aPartialInstance.id,
          cast.bFirstInstance.id,
          cast.bSecondInstance.id,
        ],
        actorUserId: cast.operatorUser.id,
        note: `${PREFIX} settlement batch`,
      },
      tErrors
    );

    expect(result.groups).toHaveLength(2);
    const groupA = result.groups.find(group => group.teacherId === cast.teacherA.id);
    const groupB = result.groups.find(group => group.teacherId === cast.teacherB.id);
    if (!groupA || !groupB) {
      throw new Error("bulk create did not return one group per teacher");
    }
    carryoverA = groupA.carryoverId;
    carryoverAPayable = groupA.payable;
    carryoverB = groupB.carryoverId;
    // Teacher A aggregates 120.00 + 60.00 (half-paid), teacher B aggregates 120.00 + 120.00, both in SAR.
    expect(groupA.payable).toBe("180.00");
    expect(groupA.currency).toBe(CurrencyCode.SAR);
    expect(groupB.payable).toBe("240.00");

    await expectSessionLinkedTo(cast.aCalculatedInstance.id, carryoverA, CalculationStatus.WAITING_PAID);
    await expectSessionLinkedTo(cast.aPartialInstance.id, carryoverA, CalculationStatus.WAITING_PAID);
    await expectSessionLinkedTo(cast.bFirstInstance.id, carryoverB, CalculationStatus.WAITING_PAID);
    await expectSessionLinkedTo(cast.bSecondInstance.id, carryoverB, CalculationStatus.WAITING_PAID);

    // Linking off PARTIALLY cleared the live percentage column (the CHECK
    // reserves it for PARTIALLY rows); the value survives on the item snapshot.
    expect((await readRawSession(cast.aPartialInstance.id)).isPartialPercentage).toBeNull();

    // Item snapshots pin each session's pre-link status for the delete restore path.
    const items = await db
      .select()
      .from(carryoverBalanceItems)
      .where(eq(carryoverBalanceItems.carryoverId, carryoverA));
    const snapshots = new Map(items.map(item => [item.classInstanceId, item]));
    expect(snapshots.get(cast.aCalculatedInstance.id)?.originalStatus).toBe(CalculationStatus.CALCULATED);
    const partialSnapshot = snapshots.get(cast.aPartialInstance.id);
    expect(partialSnapshot?.originalStatus).toBe(CalculationStatus.PARTIALLY);
    expect(partialSnapshot?.originalPartialPercentage).toBe(50);

    expect(auditActions(await readCarryoverAuditRows(carryoverA))).toContain("CARRYOVER_CREATE");
    expect(auditActions(await readCarryoverAuditRows(carryoverB))).toContain("CARRYOVER_CREATE");
  });

  test("step 3 — second operator cannot select the linked sessions while the carryover exists", async () => {
    const linked = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCreateCarryoverBalances(
        {
          instanceIds: [cast.aCalculatedInstance.id, cast.aPartialInstance.id],
          actorUserId: cast.secondOperatorUser.id,
        },
        tErrors
      )
    );

    expect(linked).toBeInstanceOf(DomainError);
    // Linked sessions sit in WAITING_PAID, so the audited-status guard is the
    // one that fires; either way the second operator cannot claim them.
    if (linked instanceof DomainError) {
      expect(linked.code).toBe("CARRYOVER_SESSION_NOT_AUDITED");
    }
    expect(linked.message).toContain(tErrors.carryover.sessionNotAudited);
  });

  test("step 4 — staff viewer without carryover permissions is denied before any row moves", async () => {
    const deleteDenied = await expectJourneyError(() =>
      CarryoverBalanceService.deleteCarryoverBalance({ id: carryoverA, actorUserId: cast.staffViewerUser.id }, tErrors)
    );
    expect(deleteDenied).toBeInstanceOf(ForbiddenError);
    if (deleteDenied instanceof ForbiddenError) {
      expect(deleteDenied.code).toBe("FORBIDDEN");
    }
    expect(deleteDenied.message).toContain(tErrors.insufficientPermissions);

    const readDenied = await expectJourneyError(() => readReportPage(cast.staffViewerUser.id, cast.teacherA.id));
    expect(readDenied).toBeInstanceOf(ForbiddenError);
    expect(readDenied.message).toContain(tErrors.insufficientPermissions);

    // The denied calls touched nothing: the carryover still lists and the sessions stay linked.
    expect(await findCarryoverRow(cast.operatorUser.id, cast.teacherA.id, carryoverA)).not.toBeNull();
    await expectSessionLinkedTo(cast.aCalculatedInstance.id, carryoverA, CalculationStatus.WAITING_PAID);
    await expectSessionLinkedTo(cast.aPartialInstance.id, carryoverA, CalculationStatus.WAITING_PAID);
    expect(auditActions(await readCarryoverAuditRows(carryoverA))).not.toContain("CARRYOVER_DELETE");
  });

  test("step 5 — delete unlinks the sessions and reverts each to its item originalStatus snapshot", async () => {
    const deleted = await CarryoverBalanceService.deleteCarryoverBalance(
      { id: carryoverA, actorUserId: cast.operatorUser.id },
      tErrors
    );
    expect(deleted).toEqual({ id: carryoverA, deleted: true });

    await expectSessionRestored(cast.aCalculatedInstance.id, CalculationStatus.CALCULATED);
    await expectSessionRestored(cast.aPartialInstance.id, CalculationStatus.PARTIALLY, 50);
    expect(await findCarryoverRow(cast.operatorUser.id, cast.teacherA.id, carryoverA)).toBeNull();
  });

  test("step 6 — deleted carryover is gone but its audit trail survives", async () => {
    const auditRows = await readCarryoverAuditRows(carryoverA);
    expect(auditActions(auditRows)).toEqual(expect.arrayContaining(["CARRYOVER_CREATE", "CARRYOVER_DELETE"]));

    const deleteRow = auditRows.find(row => row.action === "CARRYOVER_DELETE");
    const metadata = auditMetadata(deleteRow);
    expect(metadata.teacherId).toBe(cast.teacherA.id);
    expect(metadata.payable).toBe(carryoverAPayable);
    expect(metadata.currency).toBe(CurrencyCode.SAR);
    // The audit row itself carries the deleting operator as its actor.
    expect(deleteRow?.actorUserId).toBe(cast.operatorUser.id);
    expect(deleteRow?.entityId).toBe(carryoverA);

    const missing = await expectJourneyError(() =>
      CarryoverBalanceService.getById(cast.operatorUser.id, carryoverA, tErrors)
    );
    expect(missing).toBeInstanceOf(NotFoundError);
    expect(missing.message).toContain(tErrors.carryover.notFound(carryoverA));
  });

  test("step 7 — second operator re-selects the freed sessions; the first operator sees the new row", async () => {
    const recreated = await CarryoverBalanceService.bulkCreateCarryoverBalances(
      {
        instanceIds: [cast.aCalculatedInstance.id, cast.aPartialInstance.id],
        actorUserId: cast.secondOperatorUser.id,
        note: `${PREFIX} re-select after delete`,
      },
      tErrors
    );
    expect(recreated.groups).toHaveLength(1);
    const groupA2 = recreated.groups[0];
    if (!groupA2) {
      throw new Error("re-create did not return teacher A's group");
    }
    carryoverA2 = groupA2.carryoverId;
    expect(carryoverA2).not.toBe(carryoverA);

    await expectSessionLinkedTo(cast.aCalculatedInstance.id, carryoverA2, CalculationStatus.WAITING_PAID);
    await expectSessionLinkedTo(cast.aPartialInstance.id, carryoverA2, CalculationStatus.WAITING_PAID);

    // Cross-actor visibility: the deleting operator's read surfaces the second operator's carryover.
    const visible = await findCarryoverRow(cast.operatorUser.id, cast.teacherA.id, carryoverA2);
    expect(visible).not.toBeNull();
    expect(visible?.teacherId).toBe(cast.teacherA.id);
    expect(visible?.isPaid).toBe(false);
  });

  test("step 8 — teacher B's carryover settles to expense; sessions go PAID", async () => {
    const settled = await CarryoverBalanceService.bulkCarryoverToExpense(
      { carryoverIds: [carryoverB], paymentDate: "2026-09-04", actorUserId: cast.operatorUser.id },
      tErrors
    );
    expect(settled.items).toHaveLength(1);
    expect(settled.items[0]?.carryoverId).toBe(carryoverB);

    expect((await findCarryoverRow(cast.operatorUser.id, cast.teacherB.id, carryoverB))?.isPaid).toBe(true);
    await expectSessionLinkedTo(cast.bFirstInstance.id, carryoverB, CalculationStatus.PAID);
    await expectSessionLinkedTo(cast.bSecondInstance.id, carryoverB, CalculationStatus.PAID);
    expect(auditActions(await readCarryoverAuditRows(carryoverB))).toContain("CARRYOVER_TO_EXPENSE");
  });

  test("step 9 — deleting a paid carryover is rejected and the row survives", async () => {
    const paidDelete = await expectJourneyError(() =>
      CarryoverBalanceService.deleteCarryoverBalance({ id: carryoverB, actorUserId: cast.operatorUser.id }, tErrors)
    );

    expect(paidDelete).toBeInstanceOf(DomainError);
    if (paidDelete instanceof DomainError) {
      expect(paidDelete.code).toBe("CARRYOVER_PAID_CANNOT_DELETE");
    }
    expect(paidDelete.message).toContain(tErrors.carryover.paidCannotDelete);
    expect((await findCarryoverRow(cast.operatorUser.id, cast.teacherB.id, carryoverB))?.isPaid).toBe(true);
    expect(auditActions(await readCarryoverAuditRows(carryoverB))).not.toContain("CARRYOVER_DELETE");
  });

  test("step 10 — bulk delete over a paid row rejects the whole batch atomically", async () => {
    const rejected = await expectJourneyError(() =>
      CarryoverBalanceService.bulkDeleteCarryoverBalances(
        { ids: [carryoverA2, carryoverB], actorUserId: cast.operatorUser.id },
        tErrors
      )
    );

    expect(rejected).toBeInstanceOf(DomainError);
    if (rejected instanceof DomainError) {
      expect(rejected.code).toBe("CARRYOVER_PAID_CANNOT_DELETE");
    }
    expect(rejected.message).toContain(tErrors.carryover.paidCannotDelete);

    // Atomicity: the unpaid sibling is un-deleted too — both rows still list,
    // the sessions keep their links and statuses, and no delete audit rows landed.
    expect(await findCarryoverRow(cast.operatorUser.id, cast.teacherA.id, carryoverA2)).not.toBeNull();
    expect((await findCarryoverRow(cast.operatorUser.id, cast.teacherB.id, carryoverB))?.isPaid).toBe(true);
    await expectSessionLinkedTo(cast.aCalculatedInstance.id, carryoverA2, CalculationStatus.WAITING_PAID);
    await expectSessionLinkedTo(cast.aPartialInstance.id, carryoverA2, CalculationStatus.WAITING_PAID);
    await expectSessionLinkedTo(cast.bFirstInstance.id, carryoverB, CalculationStatus.PAID);
    expect(auditActions(await readCarryoverAuditRows(carryoverA2))).not.toContain("CARRYOVER_DELETE");
    expect(auditActions(await readCarryoverAuditRows(carryoverB))).not.toContain("CARRYOVER_DELETE");
  });

  test("step 11 — bulk delete of unpaid rows alone succeeds and reverts their sessions again", async () => {
    const result = await CarryoverBalanceService.bulkDeleteCarryoverBalances(
      { ids: [carryoverA2], actorUserId: cast.operatorUser.id },
      tErrors
    );
    expect(result.deletedIds).toEqual([carryoverA2]);
    expect(result.auditLogIds).toHaveLength(1);

    await expectSessionRestored(cast.aCalculatedInstance.id, CalculationStatus.CALCULATED);
    await expectSessionRestored(cast.aPartialInstance.id, CalculationStatus.PARTIALLY, 50);
    expect(await findCarryoverRow(cast.operatorUser.id, cast.teacherA.id, carryoverA2)).toBeNull();
    expect(auditActions(await readCarryoverAuditRows(carryoverA2))).toContain("CARRYOVER_DELETE");

    // Teacher B's paid carryover, spared by the atomic batch, is untouched.
    expect((await findCarryoverRow(cast.operatorUser.id, cast.teacherB.id, carryoverB))?.isPaid).toBe(true);
    await expectSessionLinkedTo(cast.bFirstInstance.id, carryoverB, CalculationStatus.PAID);
  });

  test("step 12 — the entire delete journey dispatches no notifications", () => {
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
