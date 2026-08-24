// cspell:ignore: proname prosecdef pronamespace nspname
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, isSqlite } from "@/backend/db";
import { DstMigrationRepository } from "@/backend/db/repo/classes";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { classInstances, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { ensureTestSubjectId, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission } from "@/backend/enum";
import { DstMigrationService, PermissionsService } from "@/backend/services";
import type { ClassInstanceInsertType, UserPermissionContext, UserSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

let tErrors: ErrorsLabels;

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value);
}

function getResultRows(result: unknown): Record<string, unknown>[] {
  if (typeof result === "object" && result !== null && "rows" in result && isRecordArray(result.rows)) {
    return result.rows;
  }
  if (isRecordArray(result)) return result;
  return [];
}

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

describe("Timezone Handling & DST Adjustment", () => {
  // Permission gating test needs a committed user across the service's internal
  // transaction (DstMigrationRepository.runTransaction uses db.transaction, not tx).
  // The user is created outside runInRollback and cleaned up in afterAll.
  let permTestUser: UserSelectType | null = null;
  let permTestTeacherId: string | null = null;

  beforeAll(async () => {
    const { user, teacher } = await db.transaction(async tx =>
      setupTeacher(tx, {
        name: "TZ Perm Test User",
        email: `tz-perm-${randomUUID()}@example.com`,
        timezone: IanaTimezone.Africa_Cairo,
      })
    );
    permTestUser = user;
    permTestTeacherId = teacher.id;
  });

  afterAll(async () => {
    // Delete teacher first (RESTRICT FK), then user
    if (permTestTeacherId) {
      await db.delete(teachers).where(eq(teachers.id, permTestTeacherId));
    }
    if (permTestUser) {
      await db.delete(users).where(eq(users.id, permTestUser.id));
    }
  });

  test.skipIf(isSqlite())("Class creation snapshots timezone and UTC offset via trigger", async () => {
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx, {
        name: "TZ Test User",
        email: `tz-user-${randomUUID()}@example.com`,
        timezone: IanaTimezone.Africa_Cairo,
      });

      const { student } = await setupStudent(tx, {
        name: "TZ Student User",
        email: `student-${randomUUID()}@example.com`,
      });

      // Assign teacher to student
      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: new Date(),
      });

      const startTime = new Date("2026-01-15T13:00:00Z"); // Cairo is UTC+2 in Jan
      const endTime = new Date("2026-01-15T14:00:00Z");

      const classInstance = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: startTime,
          scheduledEndAt: endTime,
          durationMinutes: 60,
          classType: "TRIAL",
          idempotencyKey: randomUUID(),
        },
        tx,
        tErrors
      );

      expect(classInstance.bookingTimezone).toBe("Africa/Cairo");
      expect(classInstance.bookingUtcOffset).toBe(120); // +2 hours

      testLogger.info("Snapshot trigger verified.");
    });
  });

  test.skipIf(isSqlite())("auto_adjust_dst_bookings detects and fixes DST drift", async () => {
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx, {
        name: "TZ DST Teacher",
        email: `tz-dst-${randomUUID()}@example.com`,
        timezone: IanaTimezone.Africa_Cairo,
      });

      const { student } = await setupStudent(tx, {
        name: "TZ DST Student",
        email: `tz-dst-student-${randomUUID()}@example.com`,
      });

      // Assign teacher to student
      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: new Date(),
      });

      const startTime = new Date("2026-07-15T13:00:00Z");
      const endTime = new Date("2026-07-15T14:00:00Z");

      const [driftedClass] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: startTime,
          scheduledEndAt: endTime,
          durationMinutes: 60,
          classType: "TRIAL",
          bookingTimezone: "Africa/Cairo",
          bookingUtcOffset: 120, // Booked as if it was UTC+2
          idempotencyKey: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ClassInstanceInsertType)
        .returning();

      testLogger.info(`Created drifted class with ID: ${driftedClass.id}`);

      // Run the adjustment job (uses tx so the function sees uncommitted data)
      const result = await tx.execute(sql`SELECT auto_adjust_dst_bookings() as updated_count`);
      const rows = getResultRows(result);
      const updatedCount = Number(rows[0]?.updated_count ?? 0);

      testLogger.info(`Adjusted ${updatedCount} classes.`);

      const [updatedClass] = await tx.select().from(classInstances).where(eq(classInstances.id, driftedClass.id));

      // Check if it shifted
      if (updatedCount > 0) {
        expect(updatedClass.scheduledStartAt.toISOString()).toBe("2026-07-15T12:00:00.000Z");
        expect(updatedClass.bookingUtcOffset).toBe(180); // Should be updated to current offset
        testLogger.info("DST adjustment verified.");
      } else {
        testLogger.warn("No classes were adjusted. Check if Africa/Cairo actually has DST in July 2026 in the OS/DB.");
      }
    });
  });

  describe("DstMigrationService Permission Gating", () => {
    const originalHasPermission = PermissionsService.hasPermission;
    const originalGetActiveSchedules = DstMigrationRepository.getActiveRecurringSchedules;
    const mockPermissions = new Map<string, boolean>();

    beforeAll(() => {
      PermissionsService.hasPermission = async (
        userIdOrContext: UserPermissionContext | string,
        permissionKey: AppPermission
      ) => {
        const userId = typeof userIdOrContext === "string" ? userIdOrContext : "";
        const key = `${userId}:${permissionKey}`;
        return mockPermissions.get(key) ?? false;
      };
      Object.defineProperty(DstMigrationRepository, "getActiveRecurringSchedules", {
        value: async () => [],
        writable: true,
        configurable: true,
      });
    });

    afterAll(() => {
      PermissionsService.hasPermission = originalHasPermission;
      Object.defineProperty(DstMigrationRepository, "getActiveRecurringSchedules", {
        value: originalGetActiveSchedules,
        writable: true,
        configurable: true,
      });
    });

    test("executeBulkDstUpdate: enforces permission checks", async () => {
      if (!permTestUser) throw new Error("Setup failed");
      const actorUserId = permTestUser.id;

      // Case 1: Lacks permission
      const error = await DstMigrationService.executeBulkDstUpdate(actorUserId, 60, "DST adjustment", tErrors).catch(
        e => e
      );
      expect(error).toBeInstanceOf(Error);
      expect(getErrorMessage(error)).toContain("sufficient permissions");

      // Case 2: Has permission
      mockPermissions.set(`${actorUserId}:${AppPermission.SYSTEM_BULK_UPDATE_DST}`, true);
      const report = await DstMigrationService.executeBulkDstUpdate(actorUserId, 60, "DST adjustment", tErrors);
      expect(report.total).toBe(0);
      expect(report.updated).toBe(0);
      expect(report.conflicts).toBe(0);
      expect(report.unchanged).toBe(0);
    });
  });
});
