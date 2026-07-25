import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import {
  ParentRepository,
  PermissionManagementRepository,
  StudentRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db/repo";
import { AppPermission, StudentStatus, SystemPermissionGroupSlug } from "@/backend/enum";
import { parseStudentStatus } from "@/backend/lib/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { StudentOnboardingInput, StudentOnboardingResult } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentOnboardingService {
  export async function createStudent(
    actorUserId: string,
    input: StudentOnboardingInput,
    tErrors: ErrorsLabels,
    locale?: string,
    tx?: DBTransaction
  ): Promise<StudentOnboardingResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENTS_CREATE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    if (input.parentId) {
      const parent = await ParentRepository.getParentProfile(input.parentId);
      if (!parent) {
        throw new Error(tErrors.parentNotFound);
      }
    }

    if (input.primaryTeacherId) {
      const teacher = await TeacherRepository.findById(input.primaryTeacherId);
      if (!teacher) {
        throw new Error(tErrors.teacherNotFound(input.primaryTeacherId));
      }
    }

    // LMS — every student must have a login account (students.userId is NOT NULL).
    // Validate email + password are provided before entering the transaction.
    const email = input.email?.trim() || null;
    const password = input.password ?? null;
    if (!email) {
      throw new Error(tErrors.studentEmailRequired);
    }
    if (!password) {
      throw new Error(tErrors.studentPasswordRequired);
    }

    const emailExists = await UserRepository.existsByEmail(email);
    if (emailExists) {
      throw new Error(tErrors.userEmailExists);
    }

    const run = async (txObj: DBTransaction): Promise<StudentOnboardingResult> => {
      // Step 1: Create the student login account (users row).
      const user = await UserRepository.create(
        {
          name: input.name,
          email: { value: email },
          password,
          ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
        },
        locale,
        txObj
      );

      if (input.timezone) {
        await UserRepository.updateTimezone(user.id, input.timezone, txObj, locale);
      }

      // Step 2: Assign the student to the STUDENT_DEFAULT permission group.
      const groups = await PermissionManagementRepository.listAllGroups(undefined, txObj);
      const studentGroup = groups.find(g => g.slug === SystemPermissionGroupSlug.STUDENT_DEFAULT);
      if (!studentGroup) {
        throw new Error(tErrors.permissionGroup.permissionGroupNotFound);
      }
      await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], studentGroup.id, actorUserId, txObj);

      // Step 3: Create the students record linked to the new user.
      const student = await StudentRepository.create(
        {
          parentId: input.parentId || null,
          userId: user.id,
          name: input.name,
          dateOfBirth: input.dateOfBirth ?? null,
          gender: input.gender ?? null,
          language: input.language ?? null,
          status: input.status ?? StudentStatus.ON_TRIAL,
          primaryTeacherId: input.primaryTeacherId ?? null,
          classesTotal: input.classesTotal ?? 0,
          classesRemaining: input.classesRemaining ?? 0,
          idempotencyKey: randomUUID(),
          ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
        },
        tErrors,
        txObj
      );

      if (input.primaryTeacherId) {
        await StudentRepository.createTeacherAssignment(
          {
            studentId: student.id,
            teacherId: input.primaryTeacherId,
            assignedByUserId: actorUserId,
          },
          txObj
        );
      }

      logger.info("Student onboarded successfully", {
        studentId: student.id,
        parentId: input.parentId,
        userId: user.id,
      });

      return {
        studentId: student.id,
        parentId: student.parentId,
        userId: user.id,
        name: student.name,
        status: parseStudentStatus(student.status) ?? StudentStatus.REGULAR,
        primaryTeacherId: student.primaryTeacherId,
      };
    };

    if (tx) {
      return await run(tx);
    }

    return await db.transaction(run);
  }
}
