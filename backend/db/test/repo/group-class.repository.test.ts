import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { GroupClassRepository } from "@/backend/db/repo";
import { classCommunications, classInstances, groupClassEnrollments, groupClasses } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import {
  createMockClassInstance,
  createTestParent,
  createTestStudent,
  createTestUser,
  setupStudent,
  setupTeacher,
} from "../entity-setup";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function gcTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    expect(typeof fn).toBe("function");
    await runInRollback(fn);
  });
}

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

async function setupGroupClassFixture(tx: DBTransaction, prefix: string) {
  const {
    user: parentUser,
    parent,
    student,
  } = await setupStudent(
    tx,
    { name: `${prefix} ParentUser`, email: `${prefix.toLowerCase()}-par-${randomUUID().slice(0, 8)}@example.com` },
    {},
    { name: `${prefix} Student` }
  );
  const { user: teacherUser, teacher } = await setupTeacher(tx, {
    name: `${prefix} TeacherUser`,
    email: `${prefix.toLowerCase()}-tea-${randomUUID().slice(0, 8)}@example.com`,
  });

  const instance = await createMockClassInstance(tx, student.id, teacher.id);

  const now = new Date();
  const [groupClass] = await tx
    .insert(groupClasses)
    .values({
      classInstanceId: instance.id,
      courseName: `${prefix} Course`,
      teacherName: teacherUser.name,
      classType: "REGULAR",
      timeSlot: "10:00-11:00",
      status: "scheduled",
      auditLoggedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { parentUser, parent, student, teacherUser, teacher, instance, groupClass };
}

async function insertEnrollment(
  tx: DBTransaction,
  groupClassId: string,
  studentId: string,
  overrides: Partial<typeof groupClassEnrollments.$inferInsert> = {}
) {
  const [row] = await tx
    .insert(groupClassEnrollments)
    .values({
      groupClassId,
      studentId,
      attendanceStatus: "pending",
      ...overrides,
    })
    .returning();
  return row;
}

async function insertCommunication(
  tx: DBTransaction,
  groupClassId: string,
  overrides: Partial<typeof classCommunications.$inferInsert> = {}
) {
  const [row] = await tx
    .insert(classCommunications)
    .values({
      groupClassId,
      type: "email",
      title: "Test Communication",
      isActive: true,
      isDelivered: false,
      ...overrides,
    })
    .returning();
  return row;
}

describe("GroupClassRepository — getByClassInstanceId", () => {
  gcTest("returns group class by class instance id", async tx => {
    const { groupClass, instance } = await setupGroupClassFixture(tx, "GetByCI");
    const result = await GroupClassRepository.getByClassInstanceId(instance.id, tx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(groupClass.id);
    expect(result?.courseName).toBe("GetByCI Course");
  });

  gcTest("returns null for non-existent class instance id", async tx => {
    const result = await GroupClassRepository.getByClassInstanceId(NIL_UUID, tx);
    expect(result).toBeNull();
  });
});

describe("GroupClassRepository — getById", () => {
  gcTest("returns group class by id", async tx => {
    const { groupClass } = await setupGroupClassFixture(tx, "GetById");
    const result = await GroupClassRepository.getById(groupClass.id, tx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(groupClass.id);
    expect(result?.courseName).toBe("GetById Course");
  });

  gcTest("returns null for non-existent id", async tx => {
    const result = await GroupClassRepository.getById(NIL_UUID, tx);
    expect(result).toBeNull();
  });
});

describe("GroupClassRepository — create", () => {
  gcTest("creates a group class with valid input", async tx => {
    const { instance, teacherUser } = await setupGroupClassFixture(tx, "CreateBase");
    const now = new Date();

    const created = await GroupClassRepository.create(
      {
        classInstanceId: instance.id,
        courseName: "Created Course",
        teacherName: teacherUser.name,
        classType: "REGULAR",
        timeSlot: "09:00-10:00",
        status: "scheduled",
        auditLoggedAt: now,
      },
      tx
    );

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.classInstanceId).toBe(instance.id);
    expect(created.courseName).toBe("Created Course");
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  gcTest("fails with invalid classInstanceId (FK violation)", async tx => {
    const error = await expectRepoError(() =>
      GroupClassRepository.create(
        {
          classInstanceId: NIL_UUID,
          courseName: "Bad FK",
          teacherName: "Teacher",
          classType: "REGULAR",
          timeSlot: "10:00-11:00",
          status: "scheduled",
          auditLoggedAt: new Date(),
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("GroupClassRepository — getEnrollments", () => {
  gcTest("returns enrollments with student name and avatar", async tx => {
    const { groupClass, student } = await setupGroupClassFixture(tx, "EnrGet");
    await insertEnrollment(tx, groupClass.id, student.id);

    const result = await GroupClassRepository.getEnrollments(groupClass.id, tx);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const found = result.find(e => e.studentId === student.id);
    expect(found).toBeDefined();
    expect(found?.studentName).toBe("EnrGet Student");
    expect(found?.attendanceStatus).toBe("pending");
  });

  gcTest("returns empty array for group class with no enrollments", async tx => {
    const { groupClass } = await setupGroupClassFixture(tx, "EnrEmpty");
    const result = await GroupClassRepository.getEnrollments(groupClass.id, tx);
    expect(result).toEqual([]);
  });
});

describe("GroupClassRepository — createEnrollments", () => {
  gcTest("creates multiple enrollments", async tx => {
    const { groupClass, student } = await setupGroupClassFixture(tx, "EnrCreate");
    const student2User = await createTestUser(tx, {
      name: "EnrCreate Student2",
      email: `enrc2-${randomUUID()}@example.com`,
    });
    const parent2 = await createTestParent(tx, student2User.id);
    const student2 = await createTestStudent(tx, parent2.id, { name: "EnrCreate S2" });

    const results = await GroupClassRepository.createEnrollments(
      [
        { groupClassId: groupClass.id, studentId: student.id, attendanceStatus: "pending" },
        { groupClassId: groupClass.id, studentId: student2.id, attendanceStatus: "pending" },
      ],
      tx
    );

    expect(results).toHaveLength(2);
    expect(results.every(r => r.groupClassId === groupClass.id)).toBeTrue();
  });

  gcTest("returns empty array for empty input", async tx => {
    const result = await GroupClassRepository.createEnrollments([], tx);
    expect(result).toEqual([]);
  });
});

describe("GroupClassRepository — getEnrollmentsWithStudentDetails", () => {
  gcTest("returns enriched enrollment rows with student name and id number", async tx => {
    const { groupClass, student } = await setupGroupClassFixture(tx, "EnrDetail");
    await insertEnrollment(tx, groupClass.id, student.id, { studentIdNumber: "STU-001" });

    const result = await GroupClassRepository.getEnrollmentsWithStudentDetails(groupClass.id, tx);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const found = result.find(e => e.studentId === student.id);
    expect(found).toBeDefined();
    expect(found?.studentName).toBe("EnrDetail Student");
    expect(found?.studentIdNumber).toBe("STU-001");
    expect(found?.attendanceStatus).toBe("pending");
  });

  gcTest("returns empty array for no enrollments", async tx => {
    const { groupClass } = await setupGroupClassFixture(tx, "EnrNoRows");
    const result = await GroupClassRepository.getEnrollmentsWithStudentDetails(groupClass.id, tx);
    expect(result).toEqual([]);
  });
});

describe("GroupClassRepository — getCommunications", () => {
  gcTest("returns communications ordered by createdAt DESC", async tx => {
    const { groupClass } = await setupGroupClassFixture(tx, "CommGet");
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await insertCommunication(tx, groupClass.id, {
      title: "Earlier comm",
      createdAt: earlier,
    });
    await insertCommunication(tx, groupClass.id, {
      title: "Later comm",
      createdAt: now,
    });

    const result = await GroupClassRepository.getCommunications(groupClass.id, tx);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const filtered = result.filter(c => c.title === "Earlier comm" || c.title === "Later comm");
    expect(filtered).toHaveLength(2);
    expect(filtered[0].title).toBe("Later comm");
    expect(filtered[1].title).toBe("Earlier comm");
  });

  gcTest("returns empty array for no communications", async tx => {
    const { groupClass } = await setupGroupClassFixture(tx, "CommEmpty");
    const result = await GroupClassRepository.getCommunications(groupClass.id, tx);
    expect(result).toEqual([]);
  });
});

describe("GroupClassRepository — createCommunication", () => {
  gcTest("creates a communication record", async tx => {
    const { groupClass } = await setupGroupClassFixture(tx, "CommCreate");
    const now = new Date();

    const created = await GroupClassRepository.createCommunication(
      {
        groupClassId: groupClass.id,
        type: "email",
        title: "New Notification",
        description: "Test description",
        isActive: true,
        isDelivered: false,
        timestamp: now,
        notificationDeliveryId: null,
        classStatusEventId: null,
      },
      tx
    );

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.groupClassId).toBe(groupClass.id);
    expect(created.type).toBe("email");
    expect(created.title).toBe("New Notification");
    expect(created.isDelivered).toBe(false);
    expect(created.createdAt).toBeInstanceOf(Date);
  });
});

describe("GroupClassRepository — updateAdminNote", () => {
  gcTest("updates adminNotes on class instance and returns group class", async tx => {
    const { groupClass, instance } = await setupGroupClassFixture(tx, "NoteUpd");

    const result = await GroupClassRepository.updateAdminNote(instance.id, "Updated admin note content", tx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(groupClass.id);

    const [updatedInstance] = await tx
      .select({ adminNotes: classInstances.adminNotes })
      .from(classInstances)
      .where(eq(classInstances.id, instance.id));
    expect(updatedInstance.adminNotes).toBe("Updated admin note content");
  });

  gcTest("returns null for non-existent class instance id", async tx => {
    const result = await GroupClassRepository.updateAdminNote(NIL_UUID, "Should not update", tx);
    expect(result).toBeNull();
  });
});

describe("GroupClassRepository — getParentUserIdsForGroupClass", () => {
  gcTest("returns parent user IDs for enrolled students", async tx => {
    const { groupClass, student, parentUser } = await setupGroupClassFixture(tx, "ParUID");
    await insertEnrollment(tx, groupClass.id, student.id);

    const result = await GroupClassRepository.getParentUserIdsForGroupClass(groupClass.id, tx);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result).toContain(parentUser.id);
  });

  gcTest("returns empty array for group class with no enrollments", async tx => {
    const { groupClass } = await setupGroupClassFixture(tx, "ParEmpty");
    const result = await GroupClassRepository.getParentUserIdsForGroupClass(groupClass.id, tx);
    expect(result).toEqual([]);
  });
});

describe("GroupClassRepository — non-transactional coverage fallback", () => {
  test("supports calls without tx for getByClassInstanceId", async () => {
    const result = await GroupClassRepository.getByClassInstanceId(NIL_UUID);
    expect(result).toBeNull();
  });

  test("supports calls without tx for getById", async () => {
    const result = await GroupClassRepository.getById(NIL_UUID);
    expect(result).toBeNull();
  });

  test("supports calls without tx for getEnrollments", async () => {
    const result = await GroupClassRepository.getEnrollments(NIL_UUID);
    expect(result).toEqual([]);
  });

  test("supports calls without tx for getEnrollmentsWithStudentDetails", async () => {
    const result = await GroupClassRepository.getEnrollmentsWithStudentDetails(NIL_UUID);
    expect(result).toEqual([]);
  });

  test("supports calls without tx for getCommunications", async () => {
    const result = await GroupClassRepository.getCommunications(NIL_UUID);
    expect(result).toEqual([]);
  });

  test("supports calls without tx for getParentUserIdsForGroupClass", async () => {
    const result = await GroupClassRepository.getParentUserIdsForGroupClass(NIL_UUID);
    expect(result).toEqual([]);
  });
});

describe("GroupClassRepository — transaction rollback", () => {
  test("rolls back group class creation on subsequent failure", async () => {
    let createdId: string | undefined;
    await runInRollback(async tx => {
      const { instance, teacherUser } = await setupGroupClassFixture(tx, "RB");
      const now = new Date();
      const created = await GroupClassRepository.create(
        {
          classInstanceId: instance.id,
          courseName: "Should be rolled back",
          teacherName: teacherUser.name,
          classType: "REGULAR",
          timeSlot: "10:00-11:00",
          status: "scheduled",
          auditLoggedAt: now,
        },
        tx
      );
      createdId = created.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdId) {
      const { db } = await import("@/backend/db/drizzleDb");
      const [found] = await db.select().from(groupClasses).where(eq(groupClasses.id, createdId)).limit(1);
      expect(found).toBeUndefined();
    }
  });
});
