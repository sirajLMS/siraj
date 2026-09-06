import { inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, carryoverBalances, expenses } from "@/backend/db/schema";
import {
  createMockClassInstance,
  createTestParent,
  createTestStudent,
  createTestTeacher,
  createTestUser,
  type TestDb,
} from "@/backend/db/test/entity-setup";
import { CalculationStatus } from "@/backend/enum";
import type {
  ClassInstanceSelectType,
  ParentSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { createCastSubjectPair, purgeCastFixture } from "@/test/workflows/helpers/cast-scaffold";
import { assignSystemGroup, type SystemGroupAssignment } from "@/test/workflows/helpers/permissions";

/** Hourly rate pinned on the cast teachers; a 60-minute audited session pays exactly 120.00 SAR. */
const TEACHER_HOURLY_RATE = "120";
const HOUR_MS = 60 * 60 * 1000;

/**
 * The actor cast for the carryover delete correction journey. Two teachers each carry
 * already-audited sessions (payroll snapshot columns committed directly, the
 * state rows a settled audit grid would hold): teacher A's pair mixes
 * `CALCULATED` and `PARTIALLY` so per-item `originalStatus` snapshot restores
 * are distinguishable and the partial-percentage round-trip is exercised;
 * teacher B's pair is uniformly `CALCULATED`. Both operators hold
 * `academy_admin` (carryover VIEW + MANAGE) while the staff viewer holds
 * `staff_default` (neither), so every denial resolves through the real
 * group-membership join.
 */
export interface CarryoverDeleteCast {
  prefix: string;
  operatorUser: UserSelectType;
  secondOperatorUser: UserSelectType;
  staffViewerUser: UserSelectType;
  teacherAUser: UserSelectType;
  teacherA: TeacherSelectType;
  teacherBUser: UserSelectType;
  teacherB: TeacherSelectType;
  parentUser: UserSelectType;
  parent: ParentSelectType;
  student: StudentSelectType;
  /** Teacher A audited session — full pay, original status CALCULATED. */
  aCalculatedInstance: ClassInstanceSelectType;
  /** Teacher A audited session — half-paid, original status PARTIALLY at 50%. */
  aPartialInstance: ClassInstanceSelectType;
  /** Teacher B audited session one — CALCULATED, full pay. */
  bFirstInstance: ClassInstanceSelectType;
  /** Teacher B audited session two — CALCULATED, full pay. */
  bSecondInstance: ClassInstanceSelectType;
  groupAssignments: SystemGroupAssignment[];
  createdSubjectId: string;
  createdCategoryId: string;
}

interface AuditedSessionSet {
  aCalculatedInstance: ClassInstanceSelectType;
  aPartialInstance: ClassInstanceSelectType;
  bFirstInstance: ClassInstanceSelectType;
  bSecondInstance: ClassInstanceSelectType;
}

/** Commits the four audited sessions: teacher A's CALCULATED + PARTIALLY pair, teacher B's two CALCULATED rows. */
async function createAuditedSessionSet(
  tx: TestDb,
  subjectId: string,
  studentId: string,
  teacherAId: string,
  teacherBId: string
): Promise<AuditedSessionSet> {
  const now = Date.now();
  const sessionBase = { subjectId, durationMinutes: 60 };
  const scheduledAt = (hoursAgo: number) => ({
    scheduledStartAt: new Date(now - hoursAgo * HOUR_MS),
    scheduledEndAt: new Date(now - (hoursAgo - 1) * HOUR_MS),
  });
  const calculatedSnapshot = {
    calculationStatus: CalculationStatus.CALCULATED,
    calculatedDuration: 60,
    teacherPaidAmount: "120.00",
    teacherPaidCurrency: CurrencyCode.SAR,
  } as const;

  const aCalculatedInstance = await createMockClassInstance(tx, studentId, teacherAId, {
    ...sessionBase,
    ...scheduledAt(8),
    ...calculatedSnapshot,
  });
  const aPartialInstance = await createMockClassInstance(tx, studentId, teacherAId, {
    ...sessionBase,
    ...scheduledAt(6),
    calculationStatus: CalculationStatus.PARTIALLY,
    calculatedDuration: 60,
    teacherPaidAmount: "60.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    isPartialPercentage: 50,
  });
  const bFirstInstance = await createMockClassInstance(tx, studentId, teacherBId, {
    ...sessionBase,
    ...scheduledAt(4),
    ...calculatedSnapshot,
  });
  const bSecondInstance = await createMockClassInstance(tx, studentId, teacherBId, {
    ...sessionBase,
    ...scheduledAt(2),
    ...calculatedSnapshot,
  });
  return { aCalculatedInstance, aPartialInstance, bFirstInstance, bSecondInstance };
}

/** Bound the honest group memberships: both operators manage, the staff viewer is view-less, teachers default. */
async function assignCastGroups(
  tx: TestDb,
  actorIds: {
    operatorUserId: string;
    secondOperatorUserId: string;
    staffViewerUserId: string;
    teacherAUserId: string;
    teacherBUserId: string;
  }
): Promise<SystemGroupAssignment[]> {
  return [
    await assignSystemGroup(tx, actorIds.operatorUserId, SystemPermissionGroupSlug.ACADEMY_ADMIN),
    await assignSystemGroup(tx, actorIds.secondOperatorUserId, SystemPermissionGroupSlug.ACADEMY_ADMIN),
    await assignSystemGroup(tx, actorIds.staffViewerUserId, SystemPermissionGroupSlug.STAFF_DEFAULT),
    await assignSystemGroup(tx, actorIds.teacherAUserId, SystemPermissionGroupSlug.TEACHER_DEFAULT),
    await assignSystemGroup(tx, actorIds.teacherBUserId, SystemPermissionGroupSlug.TEACHER_DEFAULT),
  ];
}

/**
 * Provisions the carryover cast in a single COMMITTING transaction: two
 * operators, one view-only staff member, two teachers with payroll rates, the
 * shared student, and four audited class instances whose payroll snapshots
 * make them eligible for carryover aggregation. Every row is tracked on the
 * returned cast for `afterAll` hard deletion.
 */
export async function provisionCarryoverDeleteCast(prefix: string): Promise<CarryoverDeleteCast> {
  return db.transaction(async tx => {
    const subject = await createCastSubjectPair(tx, prefix);

    const operatorUser = await createTestUser(tx, { name: `${prefix} Operator` });
    const secondOperatorUser = await createTestUser(tx, { name: `${prefix} Second Operator` });
    const staffViewerUser = await createTestUser(tx, { name: `${prefix} Staff Viewer` });
    const teacherAUser = await createTestUser(tx, { name: `${prefix} Teacher A` });
    const teacherBUser = await createTestUser(tx, { name: `${prefix} Teacher B` });
    const teacherRate = { hourlyRate: TEACHER_HOURLY_RATE, rateCurrency: CurrencyCode.SAR };
    const teacherA = await createTestTeacher(tx, teacherAUser.id, teacherRate);
    const teacherB = await createTestTeacher(tx, teacherBUser.id, teacherRate);

    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });
    const parent = await createTestParent(tx, parentUser.id);
    const student = await createTestStudent(tx, parent.id, { name: `${prefix} Student` });

    const sessions = await createAuditedSessionSet(tx, subject.subjectId, student.id, teacherA.id, teacherB.id);
    const groupAssignments = await assignCastGroups(tx, {
      operatorUserId: operatorUser.id,
      secondOperatorUserId: secondOperatorUser.id,
      staffViewerUserId: staffViewerUser.id,
      teacherAUserId: teacherAUser.id,
      teacherBUserId: teacherBUser.id,
    });

    return {
      prefix,
      operatorUser,
      secondOperatorUser,
      staffViewerUser,
      teacherAUser,
      teacherA,
      teacherBUser,
      teacherB,
      parentUser,
      parent,
      student,
      ...sessions,
      groupAssignments,
      createdSubjectId: subject.subjectId,
      createdCategoryId: subject.categoryId,
    };
  });
}

/**
 * Hard-deletes the cast in FK-safe order, INCLUDING the side-effect rows the
 * carryover services create: the real expense ledger rows any settlement
 * wrote for the cast teachers (they must go before the users/teachers they
 * reference — `expenses.created_by_user_id` is NOT NULL despite its SET NULL
 * FK), the append-only `audit_logs` rows (whose immutability trigger is
 * lifted for the sweep and restored in `finally`, mirroring the other
 * accounting journeys), any carryover rows left behind by the journey
 * (surviving items cascade with them; session links settle to NULL via
 * `onDelete: set null`), and the per-session status events. System permission
 * groups are untouched — only this run's memberships are revoked.
 */
export async function cleanupCarryoverDeleteCast(cast: CarryoverDeleteCast): Promise<void> {
  await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
  try {
    await db
      .delete(auditLogs)
      .where(inArray(auditLogs.actorUserId, [cast.operatorUser.id, cast.secondOperatorUser.id]));
    await db.transaction(async tx => {
      await tx.delete(expenses).where(inArray(expenses.teacherId, [cast.teacherA.id, cast.teacherB.id]));
      await tx
        .delete(carryoverBalances)
        .where(inArray(carryoverBalances.teacherId, [cast.teacherA.id, cast.teacherB.id]));
      await purgeCastFixture(tx, {
        instanceIds: [
          cast.aCalculatedInstance.id,
          cast.aPartialInstance.id,
          cast.bFirstInstance.id,
          cast.bSecondInstance.id,
        ],
        studentId: cast.student.id,
        parentId: cast.parent.id,
        teacherIds: [cast.teacherA.id, cast.teacherB.id],
        userIds: [
          cast.operatorUser.id,
          cast.secondOperatorUser.id,
          cast.staffViewerUser.id,
          cast.teacherAUser.id,
          cast.teacherBUser.id,
          cast.parentUser.id,
          cast.student.userId,
        ],
        groupAssignments: cast.groupAssignments,
        createdSubjectId: cast.createdSubjectId,
        createdCategoryId: cast.createdCategoryId,
      });
    });
  } finally {
    await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
  }
}
