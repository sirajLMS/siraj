import { randomUUID } from "node:crypto";
import type { AppPermission } from "@/backend/enum";
import type { ClassInstanceEntity, ParentEntity, StudentEntity, TeacherEntity, UserSelectType } from "../../types";
import type { DBTransaction } from "../db.types";
import { classInstances, parents, permissions, students, teacherAssignments, teachers, users } from "../schema";

export async function createTestUser(
  tx: DBTransaction,
  overrides: Partial<typeof users.$inferInsert> = {}
): Promise<UserSelectType> {
  const now = new Date();
  const [user] = await tx
    .insert(users)
    .values({
      name: "Test User",
      email: `test-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();
  return user;
}

export async function createTestPermission(
  tx: DBTransaction,
  key: AppPermission,
  overrides: Partial<typeof permissions.$inferInsert> = {}
): Promise<typeof permissions.$inferSelect> {
  const [perm] = await tx
    .insert(permissions)
    .values({
      key,
      resource: "test",
      action: "test_action",
      description: "Test permission",
      category: "Test",
      isSystem: false,
      ...overrides,
    })
    .returning();
  return perm;
}

export async function createTestTeacher(
  tx: DBTransaction,
  userId: string,
  overrides: Partial<typeof teachers.$inferInsert> = {}
): Promise<TeacherEntity> {
  const now = new Date();
  const [teacher] = (await tx
    .insert(teachers)
    .values({
      userId,
      status: "ACTIVATED",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning()) as [TeacherEntity];
  return teacher;
}

export async function createTestParent(
  tx: DBTransaction,
  userId: string,
  overrides: Partial<typeof parents.$inferInsert> = {}
): Promise<ParentEntity> {
  const now = new Date();
  const [parent] = (await tx
    .insert(parents)
    .values({
      userId,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning()) as [ParentEntity];
  return parent;
}

export async function createTestStudent(
  tx: DBTransaction,
  parentId: string,
  overrides: Partial<typeof students.$inferInsert> = {}
): Promise<StudentEntity> {
  const now = new Date();
  const [student] = (await tx
    .insert(students)
    .values({
      parentId,
      name: "Test Student",
      status: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning()) as [StudentEntity];
  return student;
}

export async function setupTeacher(
  tx: DBTransaction,
  userOverrides: Partial<typeof users.$inferInsert> = {},
  teacherOverrides: Partial<typeof teachers.$inferInsert> = {}
): Promise<{ user: UserSelectType; teacher: TeacherEntity }> {
  const user = await createTestUser(tx, userOverrides);
  const teacher = await createTestTeacher(tx, user.id, teacherOverrides);
  return { user, teacher };
}

export async function setupStudent(
  tx: DBTransaction,
  userOverrides: Partial<typeof users.$inferInsert> = {},
  parentOverrides: Partial<typeof parents.$inferInsert> = {},
  studentOverrides: Partial<typeof students.$inferInsert> = {}
): Promise<{ user: UserSelectType; parent: ParentEntity; student: StudentEntity }> {
  const user = await createTestUser(tx, userOverrides);
  const parent = await createTestParent(tx, user.id, parentOverrides);
  const student = await createTestStudent(tx, parent.id, studentOverrides);
  return { user, parent, student };
}

export async function createMockClassInstance(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  overrides: Partial<typeof classInstances.$inferInsert> = {}
): Promise<ClassInstanceEntity> {
  const now = new Date();
  const [instance] = await tx
    .insert(classInstances)
    .values({
      studentId,
      teacherId,
      scheduledStartAt: new Date(now.getTime() + 1000 * 60 * 60),
      scheduledEndAt: new Date(now.getTime() + 1000 * 60 * 120),
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();

  if (!instance) {
    throw new Error("Failed to create mock class instance");
  }

  return instance;
}

export async function setupTestEntities(
  tx: DBTransaction,
  prefix: string,
  options: { skipInstance?: boolean; classesRemaining?: number } = {}
): Promise<{
  parentUser: UserSelectType;
  parent: ParentEntity;
  student: StudentEntity;
  teacherUser: UserSelectType;
  teacher: TeacherEntity;
  assignment: typeof teacherAssignments.$inferSelect;
  instance: ClassInstanceEntity | null;
  now: Date;
}> {
  const now = new Date();

  const {
    user: parentUser,
    parent,
    student,
  } = await setupStudent(
    tx,
    { name: `${prefix} ParentUser`, email: `${prefix}-par-${randomUUID().slice(0, 8)}@example.com` },
    {},
    {
      name: `${prefix} Student`,
      classesRemaining: options.classesRemaining ?? 10,
      classesTotal: options.classesRemaining ?? 10,
    }
  );

  const { user: teacherUser, teacher } = await setupTeacher(tx, {
    name: `${prefix} TeacherUser`,
    email: `${prefix}-tea-${randomUUID().slice(0, 8)}@example.com`,
  });

  const [assignment] = await tx
    .insert(teacherAssignments)
    .values({
      studentId: student.id,
      teacherId: teacher.id,
      assignedAt: now,
    })
    .returning();

  const instance = options.skipInstance ? null : await createMockClassInstance(tx, student.id, teacher.id);

  return { parentUser, parent, student, teacherUser, teacher, assignment, instance, now };
}
