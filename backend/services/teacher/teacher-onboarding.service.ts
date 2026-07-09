import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import {
  PermissionManagementRepository,
  TeacherBankingRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db/repo";
import { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { getBackendTranslations, type TranslationFn } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { TeacherCreateResult } from "@/backend/types/teacher.types";
import type { UserReturnType } from "@/backend/types/user.types";
import type { ErrorsLabels } from "@/shared/messages/types/errors";

export interface TeacherOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly nationality?: string | null;
  readonly nationalId?: string | null;
  readonly phone?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: "MALE" | "FEMALE" | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly zoomLink?: string | null;
  readonly zoomUsername?: string | null;
  readonly zoomPassword?: string | null;
  readonly countryCode?: string | null;
  readonly timezoneId?: number | null;
  readonly timezone: string;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: string | null;
  readonly beneficiaryName?: string | null;
  readonly bankName?: string | null;
  readonly accountNumber?: string | null;
  readonly routingNumber?: string | null;
  readonly swiftBic?: string | null;
  readonly iban?: string | null;
}

export interface TeacherOnboardingResult {
  readonly userId: string;
  readonly teacherId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
}

export namespace TeacherOnboardingService {
  async function createUserAndTeacher(
    input: TeacherOnboardingInput,
    locale: string | undefined,
    txObj: DBTransaction
  ): Promise<{ user: UserReturnType; teacher: TeacherCreateResult }> {
    const user = await UserRepository.create(
      { name: input.name, email: { value: input.email }, password: input.password },
      locale,
      txObj
    );

    await UserRepository.updateTimezone(user.id, input.timezone, txObj, locale);

    const teacher = await TeacherRepository.create(
      {
        userId: user.id,
        status: "ACTIVATED",
        nationality: input.nationality ?? null,
        nationalId: input.nationalId ?? null,
        phone: input.phone ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        gender: input.gender ?? null,
        address: input.address ?? null,
        qualifications: input.qualifications ?? null,
        zoomLink: input.zoomLink ?? null,
        zoomUsername: input.zoomUsername ?? null,
        zoomPassword: input.zoomPassword ?? null,
        countryCode: input.countryCode ?? null,
        hourlyRate: input.hourlyRate ?? null,
        rateCurrency: input.rateCurrency ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      txObj,
      locale
    );

    return { user, teacher };
  }

  async function assignTeacherPermissionGroup(
    user: UserReturnType,
    actorUserId: string,
    t: TranslationFn<ErrorsLabels>,
    txObj: DBTransaction
  ): Promise<void> {
    const groups = await PermissionManagementRepository.listAllGroups(undefined, txObj);
    const targetGroup = groups.find(g => g.slug === SystemPermissionGroupSlug.TEACHER_DEFAULT);
    if (!targetGroup) {
      throw new Error(t("permission.groupNotFound"));
    }
    await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], targetGroup.id, actorUserId, txObj);
  }

  async function createBankingDetailsIfProvided(
    input: TeacherOnboardingInput,
    teacherId: string,
    txObj: DBTransaction,
    locale: string | undefined
  ): Promise<void> {
    const hasBankingDetails =
      input.beneficiaryName ||
      input.bankName ||
      input.accountNumber ||
      input.routingNumber ||
      input.swiftBic ||
      input.iban;

    if (hasBankingDetails) {
      await TeacherBankingRepository.submitBankingDetails(
        {
          teacherId,
          beneficiaryName: input.beneficiaryName ?? null,
          bankName: input.bankName ?? null,
          accountNumber: input.accountNumber ?? null,
          routingNumber: input.routingNumber ?? null,
          swiftBic: input.swiftBic ?? null,
          iban: input.iban ?? null,
        },
        txObj,
        locale
      );
    }
  }

  export async function createTeacher(
    actorUserId: string,
    input: TeacherOnboardingInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<TeacherOnboardingResult> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHERS_CREATE);
    if (!hasPermission) {
      throw new Error(t("insufficientPermissions"));
    }

    const emailExists = await UserRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new Error(t("user.emailAlreadyExists"));
    }

    const run = async (txObj: DBTransaction) => {
      const { user, teacher } = await createUserAndTeacher(input, locale, txObj);
      await assignTeacherPermissionGroup(user, actorUserId, t, txObj);
      await createBankingDetailsIfProvided(input, teacher.id, txObj, locale);

      logger.info("Teacher onboarded successfully", { teacherId: teacher.id, userId: user.id });

      return {
        userId: user.id,
        teacherId: teacher.id,
        name: user.name,
        email: user.email,
        status: teacher.status,
      };
    };

    if (tx) {
      return await run(tx);
    } else {
      return await db.transaction(run);
    }
  }
}
