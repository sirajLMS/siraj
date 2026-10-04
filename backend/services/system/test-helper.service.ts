import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  classInstances,
  groupClassEnrollments,
  groupClasses,
  permissionGroups,
  staffProfiles,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { AccountStatus, StudentStatus } from "@/backend/enum";
import { ParentStatus } from "@/backend/enum/parents/parent.enum";
import { hashPassword } from "@/backend/lib/auth/password";
import { logger } from "@/backend/lib/logger";
import { assertTestHelperAllowed } from "@/backend/lib/test-helper-gate";
import { PersonaSeedService, StudentSeedService, UserSeedService } from "@/backend/services/seed";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";
import {
  assignPermissionGroups,
  cleanupStaffUser,
  createProfilesAndAssignment,
  createTestUsers,
  deleteTestEntitiesInOrder,
  ensureTestStorageForGraphql,
  type TestEntitiesResult,
  type TestEntityIds,
  toDemoUserInput,
} from "@/backend/services/system/test-helper.helpers";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { INTERNAL_DEMO_USERS, resolveAdminPassword } from "@/shared/demo-users";

export namespace TestHelperService {
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

  export async function createTestEntities(prefix: string, classesRemaining: number = 10): Promise<TestEntitiesResult> {
    assertTestHelperAllowed();

    const now = new Date();
    const plainPassword = resolveAdminPassword();
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

  export async function cleanupTestEntities(args: TestEntityIds): Promise<boolean> {
    assertTestHelperAllowed();

    try {
      await db.transaction(async tx => {
        await deleteTestEntitiesInOrder(tx, args);
      });

      logger.info("Test entities cleaned up successfully via helper service", {
        studentUserId: args.studentUserId,
        teacherUserId: args.teacherUserId,
      });
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
    const plainPassword = resolveAdminPassword();
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

    // Assign to the super_admin permission group for permission-group consistency.
    // NOTE: `demoLogin("super_admin")` is blocked by `EXCLUDED_DEMO_LOGIN_GROUP_SLUGS`
    // (in demo-auth.service.ts) — tests that need a super-admin session must use direct
    // login (email + plainPassword) via the standard `login` mutation, not `demoLogin`.
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
