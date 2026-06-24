import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { Gender } from "@/shared/lib/enum";
import { testLogger } from "@/shared/lib/testlogger";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../../types";
import type { ClassInstanceEntity } from "../../../types/scheduling.types";
import type { StudentProgressSelectType } from "../../../types/student.types";
import { classInstances, parents, studentProgress, students, teacherAssignments, teachers, users } from "../../schema";
import { type DBTransaction, runInRollback, setupRlsRole, teardownRlsRole } from "../test-utils";

async function setupTestEnvironment(tx: DBTransaction, now: Date) {
  const [userP] = (await tx
    .insert(users)
    .values({
      name: "Parent",
      email: `p-${randomUUID()}@x.com`,
      password: "p",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];
  const [parent] = (await tx
    .insert(parents)
    .values({ userId: userP.id, status: "REGULAR", createdAt: now, updatedAt: now })
    .returning()) as [ParentEntity];
  const [userT] = (await tx
    .insert(users)
    .values({
      name: "Teacher",
      email: `t-${randomUUID()}@x.com`,
      password: "t",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];
  const [teacher] = (await tx
    .insert(teachers)
    .values({ userId: userT.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now })
    .returning()) as [TeacherEntity];
  const [student] = (await tx
    .insert(students)
    .values({
      parentId: parent.id,
      name: "Student",
      gender: Gender.MALE,
      status: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [StudentEntity];

  await tx.insert(teacherAssignments).values({ studentId: student.id, teacherId: teacher.id, assignedAt: now });

  const [classInst] = (await tx
    .insert(classInstances)
    .values({
      studentId: student.id,
      teacherId: teacher.id,
      scheduledStartAt: now,
      scheduledEndAt: now,
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [ClassInstanceEntity];

  return { userP, parent, userT, teacher, student, classInst };
}

describe("Student Progress Tracking", () => {
  const ROLE_NAME = "test_rls_user_prog";

  beforeAll(async () => {
    await setupRlsRole(ROLE_NAME);
  });

  afterAll(async () => {
    await teardownRlsRole(ROLE_NAME);
  });

  test("Teacher can log progress for their student", async () => {
    testLogger.info("Testing teacher logging progress...");
    await runInRollback(async tx => {
      const now = new Date();

      const { userT, teacher, student, classInst } = await setupTestEnvironment(tx, now);

      // Set actor to Teacher
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userT.id}, true)`);

      // Log progress
      await tx.insert(studentProgress).values({
        studentId: student.id,
        classInstanceId: classInst.id,
        teacherId: teacher.id,
        topicsCovered: "Intro to SQL",
        homeworkAssigned: "Create a table",
        notes: "Excellent student",
      });

      const progressResults = (await tx
        .select()
        .from(studentProgress)
        .where(eq(studentProgress.classInstanceId, classInst.id))) as StudentProgressSelectType[];
      expect(progressResults.length).toBe(1);
      const progress = progressResults[0];
      expect(progress.topicsCovered).toBe("Intro to SQL");
    });
    testLogger.info("Teacher logging progress test passed.");
  });

  test("Prevent duplicate progress for same class instance", async () => {
    testLogger.info("Testing unique constraint on student progress...");
    await runInRollback(async tx => {
      const now = new Date();
      const { teacher, student, classInst } = await setupTestEnvironment(tx, now);

      await tx.insert(studentProgress).values({
        studentId: student.id,
        classInstanceId: classInst.id,
        teacherId: teacher.id,
        topicsCovered: "A",
      });

      try {
        await tx.insert(studentProgress).values({
          studentId: student.id,
          classInstanceId: classInst.id,
          teacherId: teacher.id,
          topicsCovered: "B",
        });
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { code?: string } };
        const code = err.cause?.code || "";
        expect(code).toBe("23505");
      }
    });
    testLogger.info("Unique constraint test passed.");
  });

  test("Parent visibility control via RLS", async () => {
    testLogger.info("Testing parent RLS for progress...");
    await runInRollback(async tx => {
      const now = new Date();
      const { userP, userT, teacher, student, classInst } = await setupTestEnvironment(tx, now);

      // Insert one visible record
      await tx.insert(studentProgress).values({
        studentId: student.id,
        classInstanceId: classInst.id,
        teacherId: teacher.id,
        topicsCovered: "Visible Part",
        parentVisible: true,
      });

      // Switch to unprivileged role for RLS tests
      await tx.execute(sql`SET LOCAL ROLE ${sql.raw(ROLE_NAME)}`);

      // Set actor to Parent
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userP.id}, true)`);

      const visibleResults = (await tx
        .select()
        .from(studentProgress)
        .where(eq(studentProgress.studentId, student.id))) as StudentProgressSelectType[];
      expect(visibleResults.length).toBe(1);
      expect(visibleResults[0].topicsCovered).toBe("Visible Part");

      // Update to hidden (need to be teacher to update, since we are under RLS)
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userT.id}, true)`);
      const updateResult = await tx
        .update(studentProgress)
        .set({ parentVisible: false })
        .where(eq(studentProgress.id, visibleResults[0].id))
        .returning();
      expect(updateResult.length).toBe(1); // Ensure it actually updated

      // Check again as parent
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userP.id}, true)`);
      const hiddenResults = (await tx
        .select()
        .from(studentProgress)
        .where(eq(studentProgress.studentId, student.id))) as StudentProgressSelectType[];
      expect(hiddenResults.length).toBe(0);
    });
    testLogger.info("Parent visibility RLS test passed.");
  });
});
