import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission, Gender, SystemPermissionGroupSlug } from "@/backend/enum";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import { buildTeacherInsertPayload } from "@/backend/services/teacher/__shared__/buildTeacherInsertPayload";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type {
  DBTransaction,
  TeacherCreateReturnType,
  TeacherOnboardingInput,
  TeacherOnboardingResult,
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

const VALID_GENDERS = new Set(Object.values(Gender) as readonly string[]);

function isGenderOrNull(value: string | null): value is Gender | null {
  if (value === null) return true;
  return VALID_GENDERS.has(value);
}

export namespace TeacherOnboardingService {
  export async function createTeacher(
    actorUserId: string,
    input: TeacherOnboardingInput,
    tErrors: ErrorsLabels,
    locale?: string,
    tx?: DBTransaction
  ): Promise<TeacherOnboardingResult> {
    const { user, extension: teacher } = await UserOnboardingService.createUserOfType<TeacherCreateReturnType>(
      {
        actorUserId,
        permission: AppPermission.TEACHERS_CREATE,
        coreInput: {
          name: input.name,
          email: input.email,
          password: input.password,
          ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
        } satisfies UserCreateCoreInput,
        profileFields: {
          timezone: input.timezone,
          displayCurrency: input.displayCurrency ?? undefined,
        } satisfies UserCreateProfileFieldsInput,
        validatePassword: true,
        groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
        createExtension: async (createdUser: UserReturnType, txObj: DBTransaction) => {
          return TeacherRepository.create(buildTeacherInsertPayload(input, createdUser.id), txObj, locale);
        },
        afterExtension: async (_user: UserReturnType, _teacher: TeacherCreateReturnType, txObj: DBTransaction) => {
          if (input.initialPayoutMethod) {
            await PaymentMethodService.createUserPaymentMethodInternal(
              { ...input.initialPayoutMethod, userId: _user.id },
              txObj
            );
          }
        },
        locale,
        tErrors,
        logTag: "Teacher",
      },
      tx
    );

    return {
      userId: user.id,
      teacherId: teacher.id,
      name: user.name,
      email: user.email,
      phone: teacher.phone,
      gender: isGenderOrNull(teacher.gender) ? teacher.gender : null,
      status: teacher.status,
    };
  }
}
