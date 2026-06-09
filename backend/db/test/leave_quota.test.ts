import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type {
  LeaveQuotaUsageEntity,
  ParentEntity,
  StudentEntity,
  TeacherEntity,
  UserEntity,
} from "../../types";
import { db } from "../drizzleDb";
import { leaveQuotaUsage, parents, students, systemSettings, teachers, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("Leave Quota Limits Trigger", () => {
  test("Allows inserting leave quota usage within the default limit of two", async () => {
    testLogger.info("Testing default leave limit check (success)...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-leave-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-leave-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [parent] = (await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ParentEntity];

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Quota Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      // Insert teacher leave quota within default limit of 2 (setting 2 used leaves)
      const [teacherQuota] = (await tx
        .insert(leaveQuotaUsage)
        .values({
          teacherId: teacher.id,
          periodYear: 2026,
          periodMonth: 6,
          usedCount: 2,
        })
        .returning()) as [LeaveQuotaUsageEntity];

      expect(teacherQuota.usedCount).toBe(2);

      // Insert student leave quota within default limit of 2 (setting 1 used leaves)
      const [studentQuota] = (await tx
        .insert(leaveQuotaUsage)
        .values({
          studentId: student.id,
          periodYear: 2026,
          periodMonth: 6,
          usedCount: 1,
        })
        .returning()) as [LeaveQuotaUsageEntity];

      expect(studentQuota.usedCount).toBe(1);
    });
    testLogger.info("Default leave limit check (success) passed.");
  });

  test("Blocks inserting teacher leave quota usage exceeding the default limit of two", async () => {
    testLogger.info("Testing default teacher leave limit check (failure)...");
    await runInRollback(async tx => {
      const now = new Date();
      const teacherEmail = `teacher-leave-${randomUUID()}@example.com`;

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      // Try inserting teacher leave quota exceeding default limit of 2 (setting 3 used leaves)
      try {
        await tx
          .insert(leaveQuotaUsage)
          .values({
            teacherId: teacher.id,
            periodYear: 2026,
            periodMonth: 6,
            usedCount: 3,
          })
          .returning();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Leave quota exceeded");
      }
    });
    testLogger.info("Default teacher leave limit check (failure) passed.");
  });

  test("Blocks inserting student leave quota usage exceeding the default limit of two", async () => {
    testLogger.info("Testing default student leave limit check (failure)...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-leave-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [parent] = (await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ParentEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Quota Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      // Try inserting student leave quota exceeding default limit of 2 (setting 4 used leaves)
      try {
        await tx
          .insert(leaveQuotaUsage)
          .values({
            studentId: student.id,
            periodYear: 2026,
            periodMonth: 6,
            usedCount: 4,
          })
          .returning();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Leave quota exceeded");
      }
    });
    testLogger.info("Default student leave limit check (failure) passed.");
  });

  test("Allows inserting leave quota usage within custom teacher limit", async () => {
    testLogger.info("Testing custom teacher leave limit check...");
    await runInRollback(async tx => {
      const now = new Date();
      const teacherEmail = `teacher-leave-${randomUUID()}@example.com`;

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      // Set custom limit to 5
      await tx
        .insert(systemSettings)
        .values({
          key: "teacher_max_leaves",
          value: "5",
          dataType: "number",
          category: "leave",
          description: "Teacher maximum leaves per month",
          updatedAt: now,
        })
        .execute();

      // Should succeed inserting 4 leaves
      const [teacherQuota] = (await tx
        .insert(leaveQuotaUsage)
        .values({
          teacherId: teacher.id,
          periodYear: 2026,
          periodMonth: 6,
          usedCount: 4,
        })
        .returning()) as [LeaveQuotaUsageEntity];

      expect(teacherQuota.usedCount).toBe(4);

      // Should fail inserting 6 leaves
      try {
        await tx
          .insert(leaveQuotaUsage)
          .values({
            teacherId: teacher.id,
            periodYear: 2026,
            periodMonth: 7,
            usedCount: 6,
          })
          .returning();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Leave quota exceeded");
      }
    });
    testLogger.info("Custom teacher leave limit check passed.");
  });

  test("Allows inserting leave quota usage within custom student limit", async () => {
    testLogger.info("Testing custom student leave limit check...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-leave-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [parent] = (await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ParentEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Quota Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      // Set custom limit to 3
      await tx
        .insert(systemSettings)
        .values({
          key: "student_max_leaves",
          value: "3",
          dataType: "number",
          category: "leave",
          description: "Student maximum leaves per month",
          updatedAt: now,
        })
        .execute();

      // Should succeed inserting 3 leaves
      const [studentQuota] = (await tx
        .insert(leaveQuotaUsage)
        .values({
          studentId: student.id,
          periodYear: 2026,
          periodMonth: 6,
          usedCount: 3,
        })
        .returning()) as [LeaveQuotaUsageEntity];

      expect(studentQuota.usedCount).toBe(3);

      // Should fail inserting 4 leaves
      try {
        await tx
          .insert(leaveQuotaUsage)
          .values({
            studentId: student.id,
            periodYear: 2026,
            periodMonth: 7,
            usedCount: 4,
          })
          .returning();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Leave quota exceeded");
      }
    });
    testLogger.info("Custom student leave limit check passed.");
  });

  test("Prevents updating used count beyond the limit", async () => {
    testLogger.info("Testing leave limit update block...");
    await runInRollback(async tx => {
      const now = new Date();
      const teacherEmail = `teacher-leave-${randomUUID()}@example.com`;

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [teacherQuota] = (await tx
        .insert(leaveQuotaUsage)
        .values({
          teacherId: teacher.id,
          periodYear: 2026,
          periodMonth: 6,
          usedCount: 1,
        })
        .returning()) as [LeaveQuotaUsageEntity];

      // Update to 2 leaves (allowed under default limit of 2)
      await tx
        .update(leaveQuotaUsage)
        .set({ usedCount: 2 })
        .where(eq(leaveQuotaUsage.id, teacherQuota.id))
        .execute();

      // Update to 3 leaves (blocked under default limit of 2)
      try {
        await tx
          .update(leaveQuotaUsage)
          .set({ usedCount: 3 })
          .where(eq(leaveQuotaUsage.id, teacherQuota.id))
          .execute();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Leave quota exceeded");
      }
    });
    testLogger.info("Leave limit update block test passed.");
  });
});
