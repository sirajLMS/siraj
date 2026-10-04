import { randomUUID } from "node:crypto";
import { eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  adminAuditLogs,
  classInstances,
  classStatusEvents,
  parents,
  permissionGroups,
  staffProfiles,
  students,
  teacherAssignments,
  teachers,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import type { DBTransaction, SeedDemoUserInput } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { type INTERNAL_DEMO_USERS, resolveAdminPassword } from "@/shared/demo-users";
import { getServerTranslations } from "@/shared/locale";

export interface TestEntitiesResult {
  studentUserEmail: string;
  studentUserId: string;
  studentId: string;
  studentName: string;
  parentUserEmail: string;
  parentUserId: string;
  parentId: string;
  parentName: string;
  teacherUserEmail: string;
  teacherUserId: string;
  teacherId: string;
  teacherName: string;
}

export interface TestEntityIds {
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  studentId: string;
  teacherId: string;
  parentId: string;
}

export function toDemoUserInput(spec: (typeof INTERNAL_DEMO_USERS)[number]): SeedDemoUserInput {
  return {
    name: spec.name,
    email: spec.email,
    plainPassword: spec.plainPassword ?? resolveAdminPassword(),
    isSuperAdmin: spec.isSuperAdmin,
    groupSlug: spec.groupSlug,
  };
}

const TEST_STORAGE_DIRECTORIES = [
  "public/docs",
  "public/avatars",
  "public/avatars/students",
  "public/avatars/teachers",
  "public/avatars/parents",
  "public/invoices",
  "public/complaints",
  "public/resources",
  "private/billing",
] as const;

export async function ensureTestStorageForGraphql(): Promise<void> {
  const fileSeeder = await createFileSeedingService();
  await Promise.all(TEST_STORAGE_DIRECTORIES.map(directory => fileSeeder.ensureDirectory(directory, true)));
  const tErrors = getServerTranslations("en").errorsTranslations;
  const handbookPdf = Buffer.from("%PDF-1.4\n% test parent handbook\n");
  await SystemSettingsService.uploadParentHandbook(null, "parent-handbook.pdf", handbookPdf, tErrors);
}

export async function cleanupStaffUser(userId: string, label: string): Promise<boolean> {
  try {
    await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL session_replication_role = 'replica';`);
      await tx
        .delete(adminAuditLogs)
        .where(or(eq(adminAuditLogs.actorUserId, userId), eq(adminAuditLogs.targetUserId, userId)));
      await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.userId, userId));
      await tx.delete(staffProfiles).where(eq(staffProfiles.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });

    logger.info(`Test ${label} cleaned up successfully via helper service`, { userId });
    return true;
  } catch (error) {
    logger.error(`Failed to clean up test ${label} via helper service`, { error });
    return false;
  }
}

export async function createTestUsers(tx: DBTransaction, prefix: string, hashedPassword: string, now: Date) {
  const studentEmail = `${prefix}-stu-${randomUUID().slice(0, 8)}@example.com`;
  const parentEmail = `${prefix}-par-${randomUUID().slice(0, 8)}@example.com`;
  const teacherEmail = `${prefix}-tea-${randomUUID().slice(0, 8)}@example.com`;

  const [studentUserRow] = await tx
    .insert(users)
    .values({
      name: `${prefix} Student User`,
      email: studentEmail,
      password: hashedPassword,
      timezone: IanaTimezone.UTC,
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
      timezone: IanaTimezone.UTC,
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
      timezone: IanaTimezone.UTC,
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

async function assignPermissionGroup(tx: DBTransaction, userId: string, slug: string, assignedAt: Date): Promise<void> {
  const [group] = await tx.select().from(permissionGroups).where(eq(permissionGroups.slug, slug)).limit(1);
  if (!group) return;

  await tx.insert(userPermissionGroups).values({
    userId,
    groupId: group.id,
    assignedAt,
  });
}

export async function assignPermissionGroups(
  tx: DBTransaction,
  studentUserId: string,
  teacherUserId: string,
  parentUserId: string,
  now: Date
) {
  await assignPermissionGroup(tx, studentUserId, "student_default", now);
  await assignPermissionGroup(tx, teacherUserId, "teacher_default", now);
  await assignPermissionGroup(tx, parentUserId, "parent_default", now);
}

export async function createProfilesAndAssignment(
  tx: DBTransaction,
  parentUserRowId: string,
  teacherUserRowId: string,
  studentUserRowId: string,
  prefix: string,
  classesRemaining: number,
  now: Date
) {
  const [parentProfile] = await tx
    .insert(parents)
    .values({
      userId: parentUserRowId,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [studentProfile] = await tx
    .insert(students)
    .values({
      parentId: parentProfile.id,
      userId: studentUserRowId,
      name: `${prefix} Student`,
      status: "REGULAR",
      classesRemaining,
      classesTotal: classesRemaining,
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [teacherProfile] = await tx
    .insert(teachers)
    .values({
      userId: teacherUserRowId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

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

export async function deleteTestEntitiesInOrder(tx: DBTransaction, ids: TestEntityIds): Promise<void> {
  const { studentUserId, teacherUserId, parentUserId, studentId, teacherId, parentId } = ids;
  await tx.execute(sql`SET LOCAL session_replication_role = 'replica';`);

  const instanceIds = (
    await tx
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(or(eq(classInstances.studentId, studentId), eq(classInstances.teacherId, teacherId)))
  ).map(r => r.id);
  if (instanceIds.length > 0) {
    await tx.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, instanceIds));
  }

  await tx
    .delete(classInstances)
    .where(or(eq(classInstances.studentId, studentId), eq(classInstances.teacherId, teacherId)));

  await tx.delete(teacherAssignments).where(eq(teacherAssignments.studentId, studentId));

  await tx.delete(students).where(eq(students.id, studentId));

  await tx.delete(parents).where(eq(parents.id, parentId));

  await tx.delete(teachers).where(eq(teachers.id, teacherId));

  await tx
    .delete(userPermissionGroups)
    .where(inArray(userPermissionGroups.userId, [studentUserId, teacherUserId, parentUserId]));

  await tx
    .delete(adminAuditLogs)
    .where(
      or(
        inArray(adminAuditLogs.actorUserId, [studentUserId, teacherUserId, parentUserId]),
        inArray(adminAuditLogs.targetUserId, [studentUserId, teacherUserId, parentUserId])
      )
    );

  await tx.delete(users).where(inArray(users.id, [studentUserId, teacherUserId, parentUserId]));
}
