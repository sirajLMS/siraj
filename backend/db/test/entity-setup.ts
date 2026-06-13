import { randomUUID } from "node:crypto";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { parents, students, teachers, users } from "../schema";
import type { DbTransaction } from "./test-utils";

export async function createTestUser(tx: DbTransaction, overrides: Partial<typeof users.$inferInsert> = {}) {
  const now = new Date();
  const [user] = (await tx
    .insert(users)
    .values({
      name: "Test User",
      email: `test-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning()) as [UserEntity];
  return user;
}

export async function createTestTeacher(
  tx: DbTransaction,
  userId: string,
  overrides: Partial<typeof teachers.$inferInsert> = {}
) {
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
  tx: DbTransaction,
  userId: string,
  overrides: Partial<typeof parents.$inferInsert> = {}
) {
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
  tx: DbTransaction,
  parentId: string,
  overrides: Partial<typeof students.$inferInsert> = {}
) {
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
  tx: DbTransaction,
  userOverrides: Partial<typeof users.$inferInsert> = {},
  teacherOverrides: Partial<typeof teachers.$inferInsert> = {}
) {
  const user = await createTestUser(tx, userOverrides);
  const teacher = await createTestTeacher(tx, user.id, teacherOverrides);
  return { user, teacher };
}

export async function setupStudent(
  tx: DbTransaction,
  userOverrides: Partial<typeof users.$inferInsert> = {},
  parentOverrides: Partial<typeof parents.$inferInsert> = {},
  studentOverrides: Partial<typeof students.$inferInsert> = {}
) {
  const user = await createTestUser(tx, userOverrides);
  const parent = await createTestParent(tx, user.id, parentOverrides);
  const student = await createTestStudent(tx, parent.id, studentOverrides);
  return { user, parent, student };
}
