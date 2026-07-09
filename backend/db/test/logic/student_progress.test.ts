import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import {
  classInstances,
  parents,
  studentProgress,
  students,
  teacherAssignments,
  teachers,
  users,
} from "@/backend/db/schema";
import { Gender } from "@/backend/enum";
import type { ParentEntity, StudentEntity, StudentProgressSelectType, TeacherEntity } from "@/backend/types";
import type { ClassInstanceEntity } from "@/backend/types/scheduling.types";
import { testLogger } from "@/shared/lib/testlogger";
import { runInRollback, setupRlsRole, teardownRlsRole } from "../test-utils";

async function setupTestEnvironment(tx: DBTransaction, now: Date) {
  const [userP] = await tx
    .insert(users)
    .values({
      name: "Parent",
      email: `p-${randomUUID()}@x.com`,
      password: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const [parent] = (await tx
    .insert(parents)
    .values({ userId: userP.id, status: "REGULAR", createdAt: now, updatedAt: now })
    .returning()) as [ParentEntity];
  const [userT] = await tx
    .insert(users)
    .values({
      name: "Teacher",
      email: `t-${randomUUID()}@x.com`,
      password: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const [teacher] = (await tx
    .insert(teachers)
    .values({ userId: userT.id, status: "ACTIVATED", createdAt: now, updatedAt: now })
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
      expect(progressResults).toHaveLength(1);
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
        throw new Error("Expected duplicate progress insert to violate unique constraint");
      } catch (error) {
        const err = error as Error & { cause?: { code?: string } };
        const code = err.cause?.code || "";
        expect(code).toBe("23505");
      }
    });
    testLogger.info("Unique constraint test passed.");
  });

  test("Parent can view progress for their children via RLS", async () => {
    testLogger.info("Testing parent RLS for progress...");
    await runInRollback(async tx => {
      const now = new Date();
      const { userP, teacher, student, classInst } = await setupTestEnvironment(tx, now);

      await tx.insert(studentProgress).values({
        studentId: student.id,
        classInstanceId: classInst.id,
        teacherId: teacher.id,
        topicsCovered: "Visible Part",
        parentVisible: true,
      });

      const quotedRole = `"${ROLE_NAME}"`;
      await tx.execute(sql`SET LOCAL ROLE ${sql.raw(quotedRole)}`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userP.id}, true)`);

      const visibleResults = await tx
        .select({ id: studentProgress.id, topicsCovered: studentProgress.topicsCovered })
        .from(studentProgress)
        .where(eq(studentProgress.studentId, student.id));
      expect(visibleResults).toHaveLength(1);
      expect(visibleResults[0].topicsCovered).toBe("Visible Part");
    });
    testLogger.info("Parent visibility RLS test passed.");
  });
});
