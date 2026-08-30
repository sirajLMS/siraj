import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  auditLogs,
  classInstances,
  classStatusEvents,
  groupPermissions,
  permissionGroups,
  permissions,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { createTestUser, type TestDb } from "@/backend/db/test/entity-setup";
import { AppPermission, NotificationEventType } from "@/backend/enum";
import { CalculationStatus } from "@/backend/enum/teachers/payroll-calculation.enum";
import { ForbiddenError } from "@/backend/lib";
import { requirePermission } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { PayrollCalculationService } from "@/backend/services/teacher/payroll-calculation.service";
import type { ClassInstanceSelectType, PayrollOverrideInput, UserSelectType } from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
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
  waitForEventDispatchToUser,
} from "@/test/workflows/helpers";

/** Class-status event kind only a committed operator override can append. */
const PAYROLL_OVERRIDE_EVENT = "PAYROLL_OVERRIDE";

/** Hourly rate SAR 120 × a 60-minute session. */
const FULL_SESSION_PAY = "120.00";

const PARTIAL_PERCENTAGE = 50;

/**
 * Extra denial actors provisioned per run on top of the shared payroll cast:
 * a staff member whose real system group holds no payroll grants, and a
 * read-only auditor whose one custom group carries exactly the payroll view
 * permission (the catalog keeps view separate from manage precisely so
 * read-only auditors can exist without override capability).
 */
interface DenialExtras {
  staffUser: UserSelectType;
  viewerUser: UserSelectType;
  viewerGroupId: string;
  staffAssignment: SystemGroupAssignment;
}

async function provisionDenialExtras(prefix: string): Promise<DenialExtras> {
  return db.transaction(async tx => {
    const now = new Date();
    const staffUser = await createTestUser(tx, { name: `${prefix} Staff` });
    const viewerUser = await createTestUser(tx, { name: `${prefix} Payroll Viewer` });
    const staffAssignment = await assignSystemGroup(tx, staffUser.id, SystemPermissionGroupSlug.STAFF_DEFAULT);

    const [viewPermission] = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, AppPermission.ACCOUNTING_PAYROLL_VIEW))
      .limit(1);
    if (!viewPermission) {
      throw new Error("payroll view permission row not found in the permissions catalog");
    }

    const [viewerGroup] = await tx
      .insert(permissionGroups)
      .values({
        name: { en: `${prefix} Payroll Viewer` },
        description: { en: "Read-only payroll report access for this run" },
        isSystem: false,
        slug: `${prefix}_payroll_viewer`,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: permissionGroups.id });
    if (!viewerGroup) {
      throw new Error("payroll viewer group insert returned no row");
    }
    await tx.insert(groupPermissions).values({ groupId: viewerGroup.id, permissionId: viewPermission.id });
    await tx.insert(userPermissionGroups).values({ userId: viewerUser.id, groupId: viewerGroup.id, assignedAt: now });

    return { staffUser, viewerUser, viewerGroupId: viewerGroup.id, staffAssignment };
  });
}

async function cleanupDenialExtras(extras: DenialExtras): Promise<void> {
  await db.transaction(async (tx: TestDb) => {
    await revokeSystemGroupAssignments(tx, [extras.staffAssignment]);
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, extras.viewerUser.id));
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, extras.viewerGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, extras.viewerGroupId));
    await tx.delete(users).where(inArray(users.id, [extras.staffUser.id, extras.viewerUser.id]));
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

/**
 * The payroll-relevant projection of a class-instance row, dates frozen as ISO
 * strings so a before/after comparison catches any write — including one that
 * only bumped `updatedAt`.
 */
interface PayrollStateSnapshot {
  executionState: string;
  outcome: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  calculationStatus: string;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: string | null;
  calculatedDuration: number | null;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  payrollCalculatedAt: string | null;
  payrollCalculatedBy: string | null;
  updatedAt: string;
}

function projectPayrollState(row: ClassInstanceSelectType): PayrollStateSnapshot {
  return {
    executionState: row.executionState,
    outcome: row.outcome,
    actualStartAt: row.actualStartAt?.toISOString() ?? null,
    actualEndAt: row.actualEndAt?.toISOString() ?? null,
    calculationStatus: row.calculationStatus,
    teacherPaidAmount: row.teacherPaidAmount,
    teacherPaidCurrency: row.teacherPaidCurrency,
    calculatedDuration: row.calculatedDuration,
    isPartialPercentage: row.isPartialPercentage,
    payrollNote: row.payrollNote,
    payrollCalculatedAt: row.payrollCalculatedAt?.toISOString() ?? null,
    payrollCalculatedBy: row.payrollCalculatedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Event-row count per instance, in the fixed order of the given instance ids. */
async function readEventCounts(instanceIds: string[]): Promise<number[]> {
  const rows = await db
    .select({ classInstanceId: classStatusEvents.classInstanceId })
    .from(classStatusEvents)
    .where(inArray(classStatusEvents.classInstanceId, instanceIds));
  return instanceIds.map(id => rows.filter(row => row.classInstanceId === id).length);
}

/** Append-only admin audit rows attributed to any of this run's actors. */
async function countAuditRowsForActors(actorUserIds: string[]): Promise<number> {
  const rows = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(inArray(auditLogs.actorUserId, actorUserIds));
  return rows.length;
}

/**
 * Denial journey: unauthorized actors (teacher, parent, student, and a staff
 * member with real group memberships but no payroll grants) probe every payroll
 * surface — the report query service, the CSV export permission gate, and the
 * override mutation — while a view-only auditor proves view access covers reads
 * and the export gate but never the override. No denial may read a payroll row,
 * write state, append an audit event, mirror an admin audit row, or fan out a
 * notification.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own transactions over the
 * global `db`, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 */
describe("Payroll permission denials journey (unauthorized actors across payroll surfaces)", () => {
  const PREFIX = `jrn_deny_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: PayrollJourneyCast;
  let extras: DenialExtras;
  let dispatchSpy: DispatchSpy;
  let baselineStates: Record<string, PayrollStateSnapshot> = {};
  let baselineEventCounts: number[] = [];

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary installed before provisioning so no provisioning
    // or lifecycle fan-out can leak into a real channel.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionPayrollJourneyCast(PREFIX);
    extras = await provisionDenialExtras(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    // No override ever succeeds in this journey, so no append-only audit rows
    // reference these actors and the plain cast cleanups suffice.
    await cleanupDenialExtras(extras);
    await cleanupPayrollJourneyCast(cast);
  });

  function instanceIds(): string[] {
    return [cast.onTimeInstance.id, cast.studentAbsentInstance.id, cast.unattendedInstance.id];
  }

  function actorUserIds(): string[] {
    return [
      cast.operatorUser.id,
      cast.teacherUser.id,
      cast.parentUser.id,
      cast.student.userId,
      extras.staffUser.id,
      extras.viewerUser.id,
    ];
  }

  /** The four unauthorized actors: teaching, parental, student, and non-payroll staff personas. */
  function denialActorIds(): string[] {
    return [cast.teacherUser.id, cast.parentUser.id, cast.student.userId, extras.staffUser.id];
  }

  function buildOverrideInput(actorUserId: string): PayrollOverrideInput {
    return {
      instanceId: cast.onTimeInstance.id,
      actorUserId,
      targetStatus: CalculationStatus.PARTIALLY,
      partialPercentage: PARTIAL_PERCENTAGE,
      note: `${PREFIX} denied override attempt`,
    };
  }

  async function snapshotInstanceStates(): Promise<Record<string, PayrollStateSnapshot>> {
    const entries = await Promise.all(
      instanceIds().map(async instanceId => [instanceId, projectPayrollState(await readInstance(instanceId))] as const)
    );
    return Object.fromEntries(entries);
  }

  test("step 1 — teacher telemetry and the operator's terminal stop land the CALCULATED baseline", async () => {
    await ClassSessionService.activate(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);
    await ClassSessionService.updateStatusStart(cast.teacherUser.id, cast.onTimeInstance.id, tErrors);

    const completed = await ClassSessionService.stop(cast.operatorUser.id, cast.onTimeInstance.id, tErrors);
    expect(completed?.executionState).toBe(ClassExecutionState.COMPLETED);

    const row = await readInstance(cast.onTimeInstance.id);
    expect(row.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row.teacherPaidAmount).toBe(FULL_SESSION_PAY);

    // The completion fan-out is intercepted; once it lands the spy is cleared
    // so every later assertion sees only traffic from the calls under test.
    expect(
      await waitForEventDispatchToUser(dispatchSpy, NotificationEventType.CLASS_COMPLETED, cast.teacherUser.id)
    ).toBe(true);
    dispatchSpy.mockClear();

    baselineStates = await snapshotInstanceStates();
    baselineEventCounts = await readEventCounts(instanceIds());
    expect(await countAuditRowsForActors(actorUserIds())).toBe(0);
  });

  test("step 2 — payroll report query denies teacher, parent, student, and non-payroll staff", async () => {
    const errors = await Promise.all(
      denialActorIds().map(actorId =>
        expectJourneyError(() =>
          PayrollCalculationService.getReport(
            actorId,
            { teacherId: cast.teacher.id },
            { limit: 10, offset: 0 },
            tErrors
          )
        )
      )
    );
    for (const error of errors) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toContain(tErrors.insufficientPermissions);
    }

    // Positive control: the read-only auditor holds exactly the view
    // permission and reads the calculated row — the denials above are real
    // permission outcomes, not vacuous ones.
    const viewerPage = await PayrollCalculationService.getReport(
      extras.viewerUser.id,
      { teacherId: cast.teacher.id },
      { limit: 10, offset: 0 },
      tErrors
    );
    expect(viewerPage.rows.some(row => row.instanceId === cast.onTimeInstance.id)).toBe(true);
    expect(viewerPage.rows.find(row => row.instanceId === cast.onTimeInstance.id)?.teacherPaidAmount).toBe(
      FULL_SESSION_PAY
    );
  });

  test("step 3 — CSV export gate denies actors without the payroll view permission", async () => {
    // The CSV export route resolves the session cookie to a user id and then
    // runs exactly this permission gate before any payroll row is read; the
    // journey exercises the gate directly so the cookie/session layer stays
    // out of the test runtime.
    const errors = await Promise.all(
      denialActorIds().map(actorId =>
        expectJourneyError(() => requirePermission(actorId, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors))
      )
    );
    for (const error of errors) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toContain(tErrors.insufficientPermissions);
    }

    // The read-only auditor passes the export gate — view-level access covers
    // the CSV surface, while the service beneath re-checks the same
    // permission before its first read.
    await requirePermission(extras.viewerUser.id, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors);
  });

  test("step 4 — override mutation denies unauthorized actors and the view-only auditor", async () => {
    // VIEW grants reads, never writes: the auditor joins the four unauthorized
    // actors on the override mutation, which requires the manage permission.
    const errors = await Promise.all(
      [...denialActorIds(), extras.viewerUser.id].map(actorId =>
        expectJourneyError(() => PayrollCalculationService.applyOverride(buildOverrideInput(actorId), tErrors))
      )
    );
    for (const error of errors) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toContain(tErrors.insufficientPermissions);
    }
  });

  test("step 5 — every denial left rows, event history, audit trail, and notifications untouched", async () => {
    // Shared-state transitions: none. Every payroll field of every cast
    // instance (including the write timestamp) is identical to the baseline.
    expect(await snapshotInstanceStates()).toEqual(baselineStates);
    expect(await readEventCounts(instanceIds())).toEqual(baselineEventCounts);

    // Side effects: no override event ever landed on the calculated row.
    const overrideEvents = await db
      .select({ id: classStatusEvents.id })
      .from(classStatusEvents)
      .where(
        and(
          eq(classStatusEvents.classInstanceId, cast.onTimeInstance.id),
          eq(classStatusEvents.eventType, PAYROLL_OVERRIDE_EVENT)
        )
      );
    expect(overrideEvents).toHaveLength(0);

    // The append-only admin audit trail carries no row attributable to this
    // run's actors — denied calls mirror nothing.
    expect(await countAuditRowsForActors(actorUserIds())).toBe(0);

    // No denied call fanned out a notification.
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });
});
