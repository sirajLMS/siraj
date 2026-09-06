import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  auditLogs,
  carryoverBalanceItems,
  carryoverBalances,
  classInstances,
  classStatusEvents,
} from "@/backend/db/schema";
import { CalculationStatus } from "@/backend/enum";
import { CarryoverBalanceService, SessionAuditService } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { BulkCreateCarryoverResult, CarryoverBalanceItemSelectType } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type CarryoverCreateCast,
  type CarryoverExpenseCastExtras,
  cleanupCarryoverCreateCast,
  cleanupCarryoverExpenseExtras,
  expectJourneyError,
  provisionCarryoverCreateCast,
  provisionCarryoverExpenseExtras,
} from "@/test/workflows/helpers";

/** Audit-log action/entity constants for the carryover bulk create mutation. */
const CARRYOVER_CREATE_ACTION = "CARRYOVER_CREATE";
const CARRYOVER_ENTITY_TYPE = "CARRYOVER_BALANCE";

/** Teacher A aggregates 120.00 + 180.00 SAR across 60 + 90 minutes; teacher B one 60-minute session. */
const TEACHER_A_PAYABLE = "300.00";
const TEACHER_A_DURATION = "2.50";
const TEACHER_B_PAYABLE = "120.00";
const TEACHER_B_DURATION = "1.00";

const REPORT_PAGE = { limit: 50, offset: 0 };

/** sonarjs/no-alphabetical-sort compliant ordering for id-list equality checks. */
const compareIds = (left: string, right: string): number => left.localeCompare(right);

/** ISO calendar date offset from today, used to bound the audit-report window around the fixtures. */
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Cross-actor journey: an accounting operator bulk-creates carryover balances
 * from already-audited sessions, so the sessions move to WAITING_PAID and
 * become linked/readable for every other carryover-scope operator (audit grid
 * plus carryover report), while a view-only auditor can only read and an
 * unauthorised role sees nothing. Denial paths resolve through the real
 * permission and link guards on committed rows.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own top-level transactions
 * over the global `db`, so fixtures are committed in beforeAll and hard-
 * deleted in afterAll via the cast helpers.
 */
describe("Carryover bulk-create settlement journey (operator → operators/viewer)", () => {
  const PREFIX = `jrn_carry_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: CarryoverCreateCast;
  let extras: CarryoverExpenseCastExtras;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let created: BulkCreateCarryoverResult;

  function instanceIds(): string[] {
    return cast.sessions.map(session => session.instance.id);
  }

  function instanceIdsForTeacher(teacherId: string): string[] {
    return cast.sessions.filter(session => session.teacherId === teacherId).map(session => session.instance.id);
  }

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for notification dispatch: the carryover bulk
    // create contract dispatches nothing, so a live spy that sees any call
    // at all proves a channel would have been hit for real.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionCarryoverCreateCast(PREFIX);
    extras = await provisionCarryoverExpenseExtras(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    // Committed CARRYOVER_CREATE audit rows reference the cast actors; the
    // immutability trigger must be lifted for the sweep (same precedent as
    // the billing credit-adjustment journey).
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
            extras.secondOperatorUser.id,
            extras.viewerUser.id,
          ])
        );
      await cleanupCarryoverCreateCast(cast);
      await cleanupCarryoverExpenseExtras(extras);
    } finally {
      await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
    }
  });

  test("step 1 — precondition: audited sessions read CALCULATED on the audit grid; carryover report is empty", async () => {
    await Promise.all(
      [cast.teacherA.id, cast.teacherB.id].map(async teacherId => {
        const audit = await SessionAuditService.getReport(
          cast.operatorUser.id,
          { teacherId, dateFrom: isoDaysAgo(6), dateTo: isoDaysAgo(-1) },
          null,
          REPORT_PAGE,
          tErrors
        );
        const expectedIds = instanceIdsForTeacher(teacherId);
        const rows = audit.rows.filter(row => expectedIds.includes(row.instanceId));
        expect(rows).toHaveLength(expectedIds.length);
        for (const row of rows) {
          expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
        }
      })
    );

    // Neither operator nor the view-only auditor sees any carryover rows yet,
    // for either teacher — the report starts empty for this run's fixtures.
    const preCreate = await CarryoverBalanceService.getReport(
      extras.secondOperatorUser.id,
      { teacherId: null },
      REPORT_PAGE,
      tErrors
    );
    expect(preCreate.rows.map(row => row.teacherId)).not.toContain(cast.teacherA.id);
    expect(preCreate.rows.map(row => row.teacherId)).not.toContain(cast.teacherB.id);

    const viewerPreCreate = await CarryoverBalanceService.getReport(
      extras.viewerUser.id,
      { teacherId: cast.teacherA.id },
      REPORT_PAGE,
      tErrors
    );
    expect(viewerPreCreate.rows).toHaveLength(0);
  });

  test("step 2 — view-only auditor cannot bulk-create: denied before any write", async () => {
    const denied = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCreateCarryoverBalances(
        { instanceIds: instanceIds(), actorUserId: extras.viewerUser.id, note: `${PREFIX} denied` },
        tErrors
      )
    );
    expect(denied.message).toContain(tErrors.insufficientPermissions);

    // The denial happened before the transaction: no carryover rows, no links.
    const afterDenial = await CarryoverBalanceService.getReport(
      cast.operatorUser.id,
      { teacherId: null },
      REPORT_PAGE,
      tErrors
    );
    expect(afterDenial.rows.map(row => row.teacherId)).not.toContain(cast.teacherA.id);
    expect(afterDenial.rows.map(row => row.teacherId)).not.toContain(cast.teacherB.id);

    const untouched = await db
      .select({ calculationStatus: classInstances.calculationStatus, linked: classInstances.carryoverBalanceId })
      .from(classInstances)
      .where(inArray(classInstances.id, instanceIds()));
    for (const row of untouched) {
      expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(row.linked).toBeNull();
    }
  });

  test("step 3 — operator bulk-creates: one carryover per teacher, sessions linked and moved to WAITING_PAID", async () => {
    created = await CarryoverBalanceService.bulkCreateCarryoverBalances(
      { instanceIds: instanceIds(), actorUserId: cast.operatorUser.id, note: `${PREFIX} bulk settle` },
      tErrors
    );

    expect(created.groups).toHaveLength(2);
    expect(created.totalInstanceIds.toSorted(compareIds)).toEqual(instanceIds().toSorted(compareIds));
    expect(created.auditLogIds).toHaveLength(2);

    const groupA = created.groups.find(group => group.teacherId === cast.teacherA.id);
    const groupB = created.groups.find(group => group.teacherId === cast.teacherB.id);
    expect(groupA?.payable).toBe(TEACHER_A_PAYABLE);
    expect(groupA?.totalDuration).toBe(TEACHER_A_DURATION);
    expect(groupA?.studentsCount).toBe(2);
    expect(groupA?.currency).toBe(CurrencyCode.SAR);
    expect((groupA?.instanceIds ?? []).toSorted(compareIds)).toEqual(
      instanceIdsForTeacher(cast.teacherA.id).toSorted(compareIds)
    );
    expect(groupB?.payable).toBe(TEACHER_B_PAYABLE);
    expect(groupB?.totalDuration).toBe(TEACHER_B_DURATION);
    expect(groupB?.studentsCount).toBe(1);

    if (!groupA || !groupB) {
      throw new Error("bulk create result is missing an expected teacher group");
    }

    // Committed carryover rows: unpaid snapshots with the operator's note.
    const storedA = await db
      .select()
      .from(carryoverBalances)
      .where(eq(carryoverBalances.id, groupA.carryoverId))
      .limit(1);
    expect(storedA[0]?.payable).toBe(TEACHER_A_PAYABLE);
    expect(storedA[0]?.paid).toBe("0");
    expect(storedA[0]?.isPaid).toBe(false);
    expect(storedA[0]?.isDisabledTeacher).toBe(false);
    expect(storedA[0]?.teacherCurrency).toBe(CurrencyCode.SAR);
    expect(storedA[0]?.studentsCount).toBe(2);
    expect(storedA[0]?.studentsText).toContain(cast.studentA.name);
    expect(storedA[0]?.studentsText).toContain(cast.studentB.name);
    expect(storedA[0]?.note).toContain("bulk settle");
    expect(storedA[0]?.createdByUserId).toBe(cast.operatorUser.id);

    // Item snapshots keep the link-time amounts so later reverts can restore.
    const items = await db
      .select()
      .from(carryoverBalanceItems)
      .where(inArray(carryoverBalanceItems.carryoverId, [groupA.carryoverId, groupB.carryoverId]));
    expect(items).toHaveLength(3);
    const amountByInstance = new Map(items.map((item: CarryoverBalanceItemSelectType) => [item.classInstanceId, item]));
    for (const session of cast.sessions) {
      const item = amountByInstance.get(session.instance.id);
      expect(item?.originalAmount).toBe(session.amount);
      expect(item?.originalCurrency).toBe(CurrencyCode.SAR);
      expect(item?.originalStatus).toBe(CalculationStatus.CALCULATED);
      expect(item?.convertedAmount).toBeNull();
    }

    // The shared-state transition: every selected session is WAITING_PAID and
    // linked at its teacher's carryover — committed, not just returned.
    const instances = await db
      .select({
        id: classInstances.id,
        teacherId: classInstances.teacherId,
        calculationStatus: classInstances.calculationStatus,
        linked: classInstances.carryoverBalanceId,
      })
      .from(classInstances)
      .where(inArray(classInstances.id, instanceIds()));
    for (const row of instances) {
      expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
      expect(row.linked).toBe(row.teacherId === cast.teacherA.id ? groupA.carryoverId : groupB.carryoverId);
    }
  });

  test("step 4 — side effects: one CARRYOVER_CREATE audit row per carryover plus per-session transition events", async () => {
    const logs = await db.select().from(auditLogs).where(inArray(auditLogs.id, created.auditLogIds));
    expect(logs).toHaveLength(2);
    const groupIds = new Set(created.groups.map(group => group.carryoverId));
    for (const log of logs) {
      expect(log.action).toBe(CARRYOVER_CREATE_ACTION);
      expect(log.entityType).toBe(CARRYOVER_ENTITY_TYPE);
      expect(log.actorUserId).toBe(cast.operatorUser.id);
      expect(groupIds.has(log.entityId ?? "")).toBe(true);
    }

    // One WAITING_PAID transition event per session, attributed to the
    // operator and pointing at the carryover the session was linked into.
    const events = await db
      .select({
        classInstanceId: classStatusEvents.classInstanceId,
        description: classStatusEvents.description,
        actorUserId: classStatusEvents.actorUserId,
        fromState: classStatusEvents.fromState,
        toState: classStatusEvents.toState,
      })
      .from(classStatusEvents)
      .where(inArray(classStatusEvents.classInstanceId, instanceIds()));
    const transitions = events.filter(event => event.description?.includes("Linked to carryover"));
    expect(transitions).toHaveLength(3);
    const carryoverIdsByTeacher = new Map(created.groups.map(group => [group.teacherId, group.carryoverId] as const));
    for (const event of transitions) {
      expect(event.actorUserId).toBe(cast.operatorUser.id);
      const session = cast.sessions.find(candidate => candidate.instance.id === event.classInstanceId);
      expect(event.description).toContain(carryoverIdsByTeacher.get(session?.teacherId ?? "") ?? "");
    }
  });

  test("step 5 — cross-actor visibility: second operator and view-only auditor see rows, links, and the grid", async () => {
    await Promise.all(
      created.groups.map(async group => {
        // Both the second operator (full access) and the VIEW-only auditor read
        // the new carryover rows and their linked session snapshots.
        await Promise.all(
          [extras.secondOperatorUser.id, extras.viewerUser.id].map(async readerId => {
            const list = await CarryoverBalanceService.getReport(
              readerId,
              { teacherId: group.teacherId },
              REPORT_PAGE,
              tErrors
            );
            const row = list.rows.find(candidate => candidate.id === group.carryoverId);
            expect(row?.payable).toBe(group.payable);
            expect(row?.isPaid).toBe(false);

            const linked = await CarryoverBalanceService.getLinkedSessions(readerId, group.carryoverId, tErrors);
            expect(linked.map(session => session.id).toSorted(compareIds)).toEqual(
              group.instanceIds.toSorted(compareIds)
            );
            for (const session of linked) {
              expect(session.originalStatus).toBe(CalculationStatus.CALCULATED);
              expect(session.currentStatus).toBe(CalculationStatus.WAITING_PAID);
            }
          })
        );

        // The audit grid (SessionAuditService grid feed) reflects the linked
        // state for both operators: the sessions now read WAITING_PAID.
        await Promise.all(
          [cast.operatorUser.id, extras.secondOperatorUser.id].map(async operatorId => {
            const audit = await SessionAuditService.getReport(
              operatorId,
              { teacherId: group.teacherId, dateFrom: isoDaysAgo(6), dateTo: isoDaysAgo(-1) },
              null,
              REPORT_PAGE,
              tErrors
            );
            const rows = audit.rows.filter(row => group.instanceIds.includes(row.instanceId));
            expect(rows).toHaveLength(group.instanceIds.length);
            for (const row of rows) {
              expect(row.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
              expect(Number(row.teacherPaidAmount ?? "0")).toBeGreaterThan(0);
            }
          })
        );
      })
    );

    // An unauthorised role sees nothing: teachers hold no carryover scope at
    // all, even when they are the payable party of the very rows.
    const teacherDenied = await expectJourneyError(() =>
      CarryoverBalanceService.getReport(cast.teacherAUser.id, { teacherId: cast.teacherA.id }, REPORT_PAGE, tErrors)
    );
    expect(teacherDenied.message).toContain(tErrors.insufficientPermissions);
    const linkedDenied = await expectJourneyError(() =>
      CarryoverBalanceService.getLinkedSessions(cast.teacherAUser.id, created.groups[0]?.carryoverId ?? "", tErrors)
    );
    expect(linkedDenied.message).toContain(tErrors.insufficientPermissions);
  });

  test("step 6 — second operator cannot re-select linked sessions (already-linked / no-longer-audited guards)", async () => {
    const groupB = created.groups.find(group => group.teacherId === cast.teacherB.id);
    if (!groupB) {
      throw new Error("bulk create outcome did not carry the teacher B group");
    }

    // Legacy/migrated shape: a carryover link left on a session whose payroll
    // status was never transitioned. Every service-created link settles the
    // session to WAITING_PAID in the same transaction, so this guard is only
    // reachable on rows like this one — a direct fixture UPDATE, not a service
    // call, stages it.
    await db
      .update(classInstances)
      .set({ carryoverBalanceId: groupB.carryoverId, updatedAt: new Date() })
      .where(eq(classInstances.id, cast.legacySession.instance.id));

    const alreadyLinked = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCreateCarryoverBalances(
        {
          instanceIds: [cast.legacySession.instance.id],
          actorUserId: extras.secondOperatorUser.id,
          note: `${PREFIX} already linked selection`,
        },
        tErrors
      )
    );
    expect(alreadyLinked.message).toContain(tErrors.carryover.sessionAlreadyLinked);

    // Re-selecting the freshly linked set is also rejected honestly: those
    // sessions sit at WAITING_PAID now, so the audited-state guard fires first.
    const reselected = await expectJourneyError(() =>
      CarryoverBalanceService.bulkCreateCarryoverBalances(
        {
          instanceIds: instanceIds(),
          actorUserId: extras.secondOperatorUser.id,
          note: `${PREFIX} duplicate selection`,
        },
        tErrors
      )
    );
    expect(reselected.message).toContain(tErrors.carryover.sessionNotAudited);

    // No second write round: the carryover set and session links are exactly
    // what the first operator created.
    const stillVisible = await CarryoverBalanceService.getReport(
      cast.operatorUser.id,
      { teacherId: null },
      REPORT_PAGE,
      tErrors
    );
    const ours = stillVisible.rows.filter(
      row => row.teacherId === cast.teacherA.id || row.teacherId === cast.teacherB.id
    );
    expect(ours).toHaveLength(2);

    const links = await db
      .select({ linked: classInstances.carryoverBalanceId })
      .from(classInstances)
      .where(inArray(classInstances.id, [...instanceIds(), cast.legacySession.instance.id]));
    for (const row of links) {
      expect(row.linked).not.toBeNull();
    }

    const auditRows = await db
      .select()
      .from(auditLogs)
      .where(inArray(auditLogs.actorUserId, [extras.secondOperatorUser.id]));
    expect(auditRows).toHaveLength(0);
  });

  test("step 7 — bulk create dispatches no notifications to anyone", async () => {
    // Dispatches would be fire-and-forget after the write transaction commits,
    // so drain a small window before asserting the spy stayed silent.
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });
});
