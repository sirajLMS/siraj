import { db } from "@/backend/db/drizzleDb";
import {
  PermissionManagementRepository,
  TeacherBankingRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db/repo";
import type { Email } from "@/backend/lib/email";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, SystemPermissionGroupSlug } from "@/shared/lib/enum";

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
  readonly skypeId?: string | null;
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
  type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

  export async function createTeacher(
    actorUserId: string,
    input: TeacherOnboardingInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<TeacherOnboardingResult> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    // Permission check
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHERS_CREATE);
    if (!hasPermission) {
      throw new Error(t("insufficientPermissions"));
    }

    // Email uniqueness check
    const emailExists = await UserRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new Error(t("user.emailAlreadyExists"));
    }

    const run = async (txObj: DBTransaction) => {
      // Step 1: Create user record
      const user = await UserRepository.create(
        { name: input.name, email: { value: input.email } as Email, password: input.password },
        locale,
        txObj
      );

      // Step 2: Create teacher profile
      const teacher = await TeacherRepository.create(
        {
          userId: user.id,
          status: "ACTIVATED",
          timezone: input.timezone,
          nationality: input.nationality ?? null,
          nationalId: input.nationalId ?? null,
          phone: input.phone ?? null,
          dateOfBirth: input.dateOfBirth ?? null,
          gender: input.gender ?? null,
          address: input.address ?? null,
          qualifications: input.qualifications ?? null,
          skypeId: input.skypeId ?? null,
          zoomLink: input.zoomLink ?? null,
          zoomUsername: input.zoomUsername ?? null,
          zoomPassword: input.zoomPassword ?? null,
          countryCode: input.countryCode ?? null,
          timezoneId: input.timezoneId ?? null,
          hourlyRate: input.hourlyRate ?? null,
          rateCurrency: input.rateCurrency ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        txObj,
        locale
      );

      // Step 3: Assign permission group
      const groups = await PermissionManagementRepository.listAllGroups(txObj);
      const targetGroup = groups.find(g => g.slug === SystemPermissionGroupSlug.TEACHER_DEFAULT);
      if (!targetGroup) {
        throw new Error(t("permission.groupNotFound"));
      }

      await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], targetGroup.id, actorUserId, txObj);

      // Step 4: Submit banking details if provided
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
            teacherId: teacher.id,
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

      logger.info("Teacher onboarded successfully", {
        teacherId: teacher.id,
        userId: user.id,
        name: user.name,
        email: user.email,
      });

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
