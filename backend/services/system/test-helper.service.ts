import { randomUUID } from "node:crypto";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  classInstances,
  groupClassEnrollments,
  groupClasses,
  parents,
  permissionGroups,
  staffProfiles,
  students,
  teacherAssignments,
  teachers,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { AccountStatus, CurrencyCode, StudentStatus } from "@/backend/enum";
import { ParentStatus } from "@/backend/enum/parents/parent.enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { hashPassword } from "@/backend/lib/auth/password";
import { logger } from "@/backend/lib/logger";
import { assertTestHelperAllowed } from "@/backend/lib/test-helper-gate";
import {
  PersonaSeedService,
  type SeedDemoUserInput,
  StudentSeedService,
  UserSeedService,
} from "@/backend/services/seed";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import { DEFAULT_SEED_ADMIN_PASSWORD, INTERNAL_DEMO_USERS } from "@/shared/demo-users";
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

export namespace TestHelperService {
  type TxType = Parameters<Parameters<typeof db.transaction>[0]>[0];

  function toDemoUserInput(spec: (typeof INTERNAL_DEMO_USERS)[number]): SeedDemoUserInput {
    return {
      name: spec.name,
      email: spec.email,
      plainPassword: spec.plainPassword ?? DEFAULT_SEED_ADMIN_PASSWORD,
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

  async function ensureTestStorageForGraphql(): Promise<void> {
    const fileSeeder = await createFileSeedingService();
    await Promise.all(TEST_STORAGE_DIRECTORIES.map(directory => fileSeeder.ensureDirectory(directory, true)));
    const tErrors = getServerTranslations("en").errorsTranslations;
    const handbookPdf = Buffer.from("%PDF-1.4\n% test parent handbook\n");
    await SystemSettingsService.uploadParentHandbook(null, "parent-handbook.pdf", handbookPdf, tErrors);
  }

  /**
   * Idempotently provisions canonical demo login users (and minimal persona rows)
   * so GraphQL integration tests work on a migrated-but-unseeded database.
   */
  export async function ensureDemoUsers(): Promise<boolean> {
    assertTestHelperAllowed();

    const groups = await ReferenceDataService.listPermissionGroups();
    const groupMap = new Map(groups.map(group => [group.slug, group.id]));
    const demoUsers = await UserSeedService.upsertManyDemoUsers(INTERNAL_DEMO_USERS.map(toDemoUserInput), groupMap);
    const userByEmail = new Map(demoUsers.map(user => [user.email, user]));

    const teacherUser = userByEmail.get("teacher@siraj.local");
    if (teacherUser) {
      await PersonaSeedService.seedTeacherProfile({
        userId: teacherUser.id,
        timezone: IanaTimezone.UTC,
        status: AccountStatus.ACTIVATED,
        hourlyRate: "50",
        rateCurrency: CurrencyCode.SAR,
      });
    }

    const parentUser = userByEmail.get("parent@siraj.local");
    if (parentUser) {
      await PersonaSeedService.seedParentProfile({
        userId: parentUser.id,
        timezone: IanaTimezone.UTC,
        status: ParentStatus.REGULAR,
      });
    }

    const studentUser = userByEmail.get("student@siraj.local");
    if (studentUser && parentUser && teacherUser) {
      const [parent] = await PersonaSeedService.listParentsByUserIds([parentUser.id]);
      const [teacher] = await PersonaSeedService.listTeachersByUserIds([teacherUser.id]);
      if (parent && teacher) {
        const student = await StudentSeedService.seedStudentByKey({
          parentId: parent.id,
          userId: studentUser.id,
          primaryTeacherId: teacher.id,
          name: "Demo Student",
          avatarUrl: null,
          status: StudentStatus.REGULAR,
          classesTotal: 10,
          classesRemaining: 10,
          timezoneOverride: null,
          idempotencyKey: "demo_student_1",
        });
        await StudentSeedService.seedTeacherAssignment(student.id, teacher.id, new Date());
      }
    }

    await ensureTestStorageForGraphql();

    logger.info("Demo users ensured for GraphQL integration tests", {
      userCount: demoUsers.length,
    });
    return true;
  }

  async function cleanupStaffUser(userId: string, label: string): Promise<boolean> {
    try {
      await db.transaction(async tx => {
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

  async function createTestUsers(tx: TxType, prefix: string, hashedPassword: string, now: Date) {
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

  async function assignPermissionGroups(
    tx: TxType,
    studentUserId: string,
    teacherUserId: string,
    parentUserId: string,
    now: Date
  ) {
    const [studentGroup] = await tx
      .select()
      .from(permissionGroups)
      .where(eq(permissionGroups.slug, "student_default"))
      .limit(1);
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

    if (studentGroup) {
      await tx.insert(userPermissionGroups).values({
        userId: studentUserId,
        groupId: studentGroup.id,
        assignedAt: now,
      });
    }

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
    studentUserRowId: string,
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
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create student profile
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

    // Create teacher profile
    const [teacherProfile] = await tx
      .insert(teachers)
      .values({
        userId: teacherUserRowId,
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

  export async function createTestEntities(prefix: string, classesRemaining: number = 10): Promise<TestEntitiesResult> {
    assertTestHelperAllowed();

    const now = new Date();
    const plainPassword = DEFAULT_SEED_ADMIN_PASSWORD;
    const hashedPassword = await hashPassword(plainPassword);

    return await db.transaction(async tx => {
      const { studentUserRow, studentEmail, parentUserRow, parentEmail, teacherUserRow, teacherEmail } =
        await createTestUsers(tx, prefix, hashedPassword, now);

      await assignPermissionGroups(tx, studentUserRow.id, teacherUserRow.id, parentUserRow.id, now);

      const { studentId, parentId, teacherId } = await createProfilesAndAssignment(
        tx,
        parentUserRow.id,
        teacherUserRow.id,
        studentUserRow.id,
        prefix,
        classesRemaining,
        now
      );

      logger.info("Test entities created successfully via helper service", { prefix });

      return {
        studentUserEmail: studentEmail,
        studentUserId: studentUserRow.id,
        studentId,
        studentName: `${prefix} Student`,
        parentUserEmail: parentEmail,
        parentUserId: parentUserRow.id,
        parentId,
        parentName: parentUserRow.name,
        teacherUserEmail: teacherEmail,
        teacherUserId: teacherUserRow.id,
        teacherId,
        teacherName: teacherUserRow.name,
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
    assertTestHelperAllowed();
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

  export async function createTestGroupClass(
    classInstanceId: string,
    teacherName: string
  ): Promise<{ groupClassId: string }> {
    assertTestHelperAllowed();

    const now = new Date();
    const [classInstance] = await db
      .select({
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
        classType: classInstances.classType,
      })
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);

    if (!classInstance) throw new Error("Class instance not found");

    const [inserted] = await db
      .insert(groupClasses)
      .values({
        classInstanceId,
        courseName: `TestCourse-${classInstanceId.slice(0, 8)}`,
        teacherName,
        classType: classInstance.classType,
        originalDate: null,
        rescheduledDate: null,
        timeSlot: `${classInstance.scheduledStartAt.toISOString().slice(11, 16)} - ${classInstance.scheduledEndAt.toISOString().slice(11, 16)}`,
        status: "NOT_ACTIVATED",
        auditRemark: null,
        auditLoggedAt: now,
      })
      .returning();

    if (!inserted) throw new Error("Failed to insert group class");

    logger.info("Test group class created successfully", { classInstanceId, groupClassId: inserted.id });
    return { groupClassId: inserted.id };
  }

  export async function cleanupTestGroupClass(groupClassId: string): Promise<boolean> {
    assertTestHelperAllowed();

    try {
      await db.delete(groupClassEnrollments).where(eq(groupClassEnrollments.groupClassId, groupClassId));
      await db.delete(groupClasses).where(eq(groupClasses.id, groupClassId));
      logger.info("Test group class cleaned up successfully", { groupClassId });
      return true;
    } catch (error) {
      logger.error("Failed to clean up test group class", { error });
      return false;
    }
  }

  export async function createTestSuperAdmin(prefix: string): Promise<{ userId: string; email: string }> {
    assertTestHelperAllowed();

    const now = new Date();
    const email = `${prefix}-sa-${randomUUID().slice(0, 8)}@example.com`;
    const plainPassword = DEFAULT_SEED_ADMIN_PASSWORD;
    const hashedPassword = await hashPassword(plainPassword);

    const [userRow] = await db
      .insert(users)
      .values({
        name: `${prefix} Super Admin`,
        email,
        password: hashedPassword,
        isSuperAdmin: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Assign to the super_admin permission group so demoLogin("super_admin") can find this user
    const [superAdminGroup] = await db
      .select()
      .from(permissionGroups)
      .where(eq(permissionGroups.slug, "super_admin"))
      .limit(1);

    if (superAdminGroup) {
      await db
        .insert(userPermissionGroups)
        .values({
          userId: userRow.id,
          groupId: superAdminGroup.id,
          assignedAt: now,
        })
        .onConflictDoNothing();
    }

    // Create staff profile (required for manager/super-admin queries)
    await db
      .insert(staffProfiles)
      .values({
        userId: userRow.id,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    logger.info("Test super admin created successfully via helper service", { prefix, userId: userRow.id });

    return { userId: userRow.id, email: userRow.email };
  }

  export async function cleanupTestSuperAdmin(userId: string): Promise<boolean> {
    assertTestHelperAllowed();
    return cleanupStaffUser(userId, "super admin");
  }

  export async function cleanupTestManager(userId: string): Promise<boolean> {
    assertTestHelperAllowed();
    return cleanupStaffUser(userId, "manager");
  }
}
