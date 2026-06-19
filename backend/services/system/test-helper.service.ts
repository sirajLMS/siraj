import { randomUUID } from "node:crypto";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  classInstances,
  parents,
  permissionGroups,
  students,
  teacherAssignments,
  teachers,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { hashPassword } from "@/backend/lib/auth/password";
import { logger } from "@/backend/lib/logger";

export interface TestEntitiesResult {
  studentUserEmail: string;
  studentUserId: string;
  studentId: string;
  parentUserEmail: string;
  parentUserId: string;
  parentId: string;
  teacherUserEmail: string;
  teacherUserId: string;
  teacherId: string;
}

export namespace TestHelperService {
  type TxType = Parameters<Parameters<typeof db.transaction>[0]>[0];

  async function createTestUsers(
    tx: TxType,
    prefix: string,
    hashedPassword: string,
    now: Date
  ) {
    const studentEmail = `${prefix}-student-${randomUUID()}@example.com`;
    const parentEmail = `${prefix}-parent-${randomUUID()}@example.com`;
    const teacherEmail = `${prefix}-teacher-${randomUUID()}@example.com`;

    const [studentUserRow] = await tx
      .insert(users)
      .values({
        name: `${prefix} Student User`,
        email: studentEmail,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const [parentUserRow] = await tx
      .insert(users)
      .values({
        name: `${prefix} Parent User`,
        email: parentEmail,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const [teacherUserRow] = await tx
      .insert(users)
      .values({
        name: `${prefix} Teacher User`,
        email: teacherEmail,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      studentUserRow,
      studentEmail,
      parentUserRow,
      parentEmail,
      teacherUserRow,
      teacherEmail,
    };
  }

  async function assignPermissionGroups(
    tx: TxType,
    teacherUserId: string,
    parentUserId: string,
    now: Date
  ) {
    const [teacherGroup] = await tx
      .select()
      .from(permissionGroups)
      .where(eq(permissionGroups.slug, "teacher_default"))
      .limit(1);
    const [parentGroup] = await tx
      .select()
      .from(permissionGroups)
      .where(eq(permissionGroups.slug, "parent_default"))
      .limit(1);

    if (teacherGroup) {
      await tx.insert(userPermissionGroups).values({
        userId: teacherUserId,
        groupId: teacherGroup.id,
        assignedAt: now,
      });
    }

    if (parentGroup) {
      await tx.insert(userPermissionGroups).values({
        userId: parentUserId,
        groupId: parentGroup.id,
        assignedAt: now,
      });
    }
  }

  async function createProfilesAndAssignment(
    tx: TxType,
    parentUserRowId: string,
    teacherUserRowId: string,
    prefix: string,
    classesRemaining: number,
    now: Date
  ) {
    // Create parent profile
    const [parentProfile] = await tx
      .insert(parents)
      .values({
        userId: parentUserRowId,
        status: "REGULAR",
        timezone: "UTC",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create student profile
    const [studentProfile] = await tx
      .insert(students)
      .values({
        parentId: parentProfile.id,
        name: `${prefix} Student`,
        status: "REGULAR",
        classesRemaining,
        classesTotal: classesRemaining,
        idempotencyKey: randomUUID(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create teacher profile
    const [teacherProfile] = await tx
      .insert(teachers)
      .values({
        userId: teacherUserRowId,
        status: "ACTIVATED",
        timezone: "UTC",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create teacher assignment linking student and teacher
    await tx.insert(teacherAssignments).values({
      studentId: studentProfile.id,
      teacherId: teacherProfile.id,
      assignedAt: now,
    });

    return {
      studentId: studentProfile.id,
      parentId: parentProfile.id,
      teacherId: teacherProfile.id,
    };
  }

  export async function createTestEntities(
    prefix: string,
    classesRemaining: number = 10
  ): Promise<TestEntitiesResult> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Test helper service is not allowed in production environment.");
    }

    const now = new Date();
    const plainPassword = "password";
    const hashedPassword = await hashPassword(plainPassword);

    return await db.transaction(async tx => {
      const {
        studentUserRow,
        studentEmail,
        parentUserRow,
        parentEmail,
        teacherUserRow,
        teacherEmail,
      } = await createTestUsers(tx, prefix, hashedPassword, now);

      await assignPermissionGroups(tx, teacherUserRow.id, parentUserRow.id, now);

      const { studentId, parentId, teacherId } = await createProfilesAndAssignment(
        tx,
        parentUserRow.id,
        teacherUserRow.id,
        prefix,
        classesRemaining,
        now
      );

      logger.info("Test entities created successfully via helper service", { prefix });

      return {
        studentUserEmail: studentEmail,
        studentUserId: studentUserRow.id,
        studentId,
        parentUserEmail: parentEmail,
        parentUserId: parentUserRow.id,
        parentId,
        teacherUserEmail: teacherEmail,
        teacherUserId: teacherUserRow.id,
        teacherId,
      };
    });
  }

  export async function cleanupTestEntities(args: {
    studentUserId: string;
    teacherUserId: string;
    parentUserId: string;
    studentId: string;
    teacherId: string;
    parentId: string;
  }): Promise<boolean> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Test helper service is not allowed in production environment.");
    }
    const { studentUserId, teacherUserId, parentUserId, studentId, teacherId, parentId } = args;

    try {
      await db.transaction(async tx => {
        // Delete in order to satisfy restrict foreign key constraints
        // 1. Delete class instances referencing student/teacher
        await tx
          .delete(classInstances)
          .where(or(eq(classInstances.studentId, studentId), eq(classInstances.teacherId, teacherId)));

        // 2. Delete teacher assignments
        await tx.delete(teacherAssignments).where(eq(teacherAssignments.studentId, studentId));

        // 3. Delete student profile
        await tx.delete(students).where(eq(students.id, studentId));

        // 4. Delete parent profile
        await tx.delete(parents).where(eq(parents.id, parentId));

        // 5. Delete teacher profile
        await tx.delete(teachers).where(eq(teachers.id, teacherId));

        // 6. Delete user permission groups links
        await tx
          .delete(userPermissionGroups)
          .where(inArray(userPermissionGroups.userId, [studentUserId, teacherUserId, parentUserId]));

        // 7. Delete users
        await tx.delete(users).where(inArray(users.id, [studentUserId, teacherUserId, parentUserId]));
      });

      logger.info("Test entities cleaned up successfully via helper service", { studentUserId, teacherUserId });
      return true;
    } catch (error) {
      logger.error("Failed to clean up test entities via helper service", { error });
      return false;
    }
  }
}
