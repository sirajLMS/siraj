import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { AppPermission, StudentStatus, SystemPermissionGroupSlug } from "@/backend/enum";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type { StudentOnboardingInput, StudentOnboardingResult } from "@/backend/types";
import type {
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types/users/user.types";
import { parseStudentStatus } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentOnboardingService {
  export async function createStudent(
    actorUserId: string,
    input: StudentOnboardingInput,
    tErrors: ErrorsLabels,
    locale?: string,
    tx?: DBTransaction
  ): Promise<StudentOnboardingResult> {
    // LMS — every student must have a login account (students.userId is NOT NULL).
    // Validate email + password are provided before entering the transaction.
    const email = input.email?.trim() || null;
    if (!email) {
      throw new Error(tErrors.studentEmailRequired);
    }
    const password = input.password ?? null;
    if (!password) {
      throw new Error(tErrors.studentPasswordRequired);
    }

    const result = await UserOnboardingService.createUserOfType(
      {
        actorUserId,
        permission: AppPermission.STUDENTS_CREATE,
        coreInput: {
          name: input.name,
          email,
          password,
          ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
        } satisfies UserCreateCoreInput,
        profileFields: {
          phone: input.phone ?? undefined,
          timezone: input.timezone ?? undefined,
          displayCurrency: input.displayCurrency ?? undefined,
        } satisfies UserCreateProfileFieldsInput,
        groupSlug: SystemPermissionGroupSlug.STUDENT_DEFAULT,
        preChecks: async () => {
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
        },
        createExtension: async (createdUser: UserReturnType, txObj: DBTransaction) => {
          return StudentRepository.create(
            {
              parentId: input.parentId || null,
              userId: createdUser.id,
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
        },
        afterExtension: async (_createdUser: UserReturnType, student, txObj: DBTransaction) => {
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
        },
        locale,
        tErrors,
        logTag: "Student",
      },
      tx
    );

    const student = result.extension;
    return {
      studentId: student.id,
      parentId: student.parentId,
      userId: result.user.id,
      name: student.name,
      status: parseStudentStatus(student.status) ?? StudentStatus.REGULAR,
      primaryTeacherId: student.primaryTeacherId,
    };
  }
}
