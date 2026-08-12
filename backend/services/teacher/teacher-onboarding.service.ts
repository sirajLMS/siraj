import type { DBTransaction } from "@/backend/types";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission, Gender, SystemPermissionGroupSlug } from "@/backend/enum";
import { type CurrencyCode } from "@/shared/constants/currency.enum";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import { buildTeacherInsertPayload } from "@/backend/services/teacher/__shared__/buildTeacherInsertPayload";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type { UserPaymentMethodSubmitInput } from "@/backend/types/billing/payment-method.types";
import type { TeacherCreateReturnType } from "@/backend/types/teachers/teacher.types";
import type {
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types/users/user.types";
import type { ErrorsLabels } from "@/shared/locale";

export interface TeacherOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly nationality?: string | null;
  readonly nationalId?: string | null;
  readonly phone?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: "MALE" | "FEMALE" | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly countryCode?: string | null;
  readonly timezoneId?: number | null;
  readonly timezone: string;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: CurrencyCode | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly initialPayoutMethod?: Omit<UserPaymentMethodSubmitInput, "userId"> | null;
}

const VALID_GENDERS = new Set(Object.values(Gender) as readonly string[]);

function isGenderOrNull(value: string | null): value is Gender | null {
  if (value === null) return true;
  return VALID_GENDERS.has(value);
}

export interface TeacherOnboardingResult {
  readonly userId: string;
  readonly teacherId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly phone?: string | null;
  readonly gender?: Gender | null;
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
