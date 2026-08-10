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
import { ensureTestSubjectId } from "@/backend/db/test/entity-setup";
import { runInRollback, setupRlsRole, teardownRlsRole } from "@/backend/db/test/test-utils";
import { Gender } from "@/backend/enum";
import type { ParentEntity, StudentProgressSelectType, StudentSelectType, TeacherSelectType } from "@/backend/types";
import type { ClassInstanceSelectType } from "@/backend/types/classes/class-instance-detail.types";
import { testLogger } from "@/shared/lib/logger/testlogger";

async function insertUser(tx: DBTransaction, now: Date, name: string, prefix: string) {
  const [user] = await tx
    .insert(users)
    .values({
      name,
      email: `${prefix}-${randomUUID()}@x.com`,
      password: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return user;
}

async function insertParent(tx: DBTransaction, now: Date, userId: string): Promise<ParentEntity> {
  const [parent] = await tx
    .insert(parents)
    .values({ userId, status: "REGULAR", createdAt: now, updatedAt: now })
    .returning();
  return parent;
}

async function insertTeacher(tx: DBTransaction, now: Date, userId: string): Promise<TeacherSelectType> {
  const [teacher] = await tx.insert(teachers).values({ userId, createdAt: now, updatedAt: now }).returning();
  return teacher;
}

async function insertStudent(
  tx: DBTransaction,
  now: Date,
  parentId: string,
  userId: string
): Promise<StudentSelectType> {
  const [student] = await tx
    .insert(students)
    .values({
      parentId,
      userId,
      name: "Student",
      gender: Gender.MALE,
      status: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return student;
}

async function insertClassInstance(
  tx: DBTransaction,
  now: Date,
  studentId: string,
  teacherId: string
): Promise<ClassInstanceSelectType> {
  const [classInst] = await tx
    .insert(classInstances)
    .values({
      studentId,
      teacherId,
      subjectId: await ensureTestSubjectId(tx),
      scheduledStartAt: now,
      scheduledEndAt: now,
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return classInst;
}

async function setupTestEnvironment(tx: DBTransaction, now: Date) {
  const userP = await insertUser(tx, now, "Parent", "p");
  const parent = await insertParent(tx, now, userP.id);

  const userT = await insertUser(tx, now, "Teacher", "t");
  const teacher = await insertTeacher(tx, now, userT.id);

  const userS = await insertUser(tx, now, "Student", "s");
  const student = await insertStudent(tx, now, parent.id, userS.id);

  await tx.insert(teacherAssignments).values({ studentId: student.id, teacherId: teacher.id, assignedAt: now });

  const classInst = await insertClassInstance(tx, now, student.id, teacher.id);

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
        let code = "";
        if (
          error instanceof Error &&
          error.cause !== null &&
          error.cause !== undefined &&
          typeof error.cause === "object" &&
          "code" in error.cause
        ) {
          const causeCode = error.cause.code;
          code = typeof causeCode === "string" ? causeCode : "";
        }
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
