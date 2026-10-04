import { AppPermission, StudentStatus, SystemPermissionGroupSlug } from "@/backend/enum";
import {
  buildOnboardingPreChecks,
  buildPrimaryTeacherAssignment,
  buildStudentCoreInput,
  buildStudentExtensionCreator,
  buildStudentProfileFields,
  resolveStudentCredentials,
} from "@/backend/services/student/student-onboarding.helpers";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type { DBTransaction, StudentOnboardingInput, StudentOnboardingResult } from "@/backend/types";
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
    const { email, password } = resolveStudentCredentials(input, tErrors);

    const result = await UserOnboardingService.createUserOfType(
      {
        actorUserId,
        permission: AppPermission.STUDENTS_CREATE,
        coreInput: buildStudentCoreInput(input, email, password),
        profileFields: buildStudentProfileFields(input),
        groupSlug: SystemPermissionGroupSlug.STUDENT_DEFAULT,
        preChecks: buildOnboardingPreChecks(input, tErrors),
        createExtension: buildStudentExtensionCreator(input, tErrors),
        afterExtension: buildPrimaryTeacherAssignment(input, actorUserId),
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
