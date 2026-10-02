import { TeacherRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateTeacherWrite } from "@/backend/services/cache";
import { PROFILE_FIELD_GROUPS } from "@/backend/services/profile/profile-field-manifest";
import type { TeacherProfileReturnType, TeacherProfileUpdateInput } from "@/backend/types";
import { parseNationalId, serializeNationalId } from "@/shared/lib/national-id";
import { getServerTranslations } from "@/shared/locale";

function maskNationalId(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }
  const maskedPrefix = "*".repeat(Math.min(trimmed.length - 4, 8));
  return `${maskedPrefix}${trimmed.slice(-4)}`;
}

function toMaskedTeacherProfile(profile: TeacherProfileReturnType): TeacherProfileReturnType {
  // The profile row's nationalId is the serialized `countryCode:number` string;
  // mask only the number part, keeping the country visible.
  const parsed = parseNationalId(profile.nationalId);
  return {
    ...profile,
    nationalId: parsed
      ? serializeNationalId({ countryCode: parsed.countryCode, number: maskNationalId(parsed.number) })
      : null,
  };
}

function assertPermission(hasPermission: boolean, locale?: string): void {
  if (!hasPermission) {
    const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
    throw new Error(tFunc.insufficientPermissions);
  }
}

async function fetchTeacherProfileOrThrow(teacherId: string, locale?: string): Promise<TeacherProfileReturnType> {
  const profile = await TeacherRepository.getTeacherProfileForEdit(teacherId);
  if (!profile) {
    const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
    throw new Error(tFunc.teacherNotFound(teacherId));
  }
  return profile;
}

export namespace StaffProfileService {
  export async function updateTeacherProfile(
    actorUserId: string,
    teacherId: string,
    input: TeacherProfileUpdateInput,
    locale?: string
  ): Promise<TeacherProfileReturnType> {
    assertPermission(
      await PermissionsService.hasPermission(actorUserId, AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER),
      locale
    );

    const { timezone: timezoneInput, status, nationalId, ...restInput } = input;

    if (timezoneInput != null) {
      const teacher = await TeacherRepository.findById(teacherId);
      if (!teacher) {
        const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
        throw new Error(tFunc.teacherNotFound(teacherId));
      }
      await UserRepository.updateTimezone(teacher.userId, timezoneInput, undefined, locale);
    }

    if (status != null) {
      const teacher = await TeacherRepository.findById(teacherId);
      if (!teacher) {
        const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
        throw new Error(tFunc.teacherNotFound(teacherId));
      }
      await UserRepository.updateStatus(teacher.userId, status, undefined, locale);
    }

    const success = await TeacherRepository.updateTeacherProfile(teacherId, {
      ...restInput,
      nationalId: serializeNationalId(nationalId) ?? undefined,
    });

    if (!success) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.teacherNotFound(teacherId));
    }

    const profile = await fetchTeacherProfileOrThrow(teacherId, locale);

    try {
      await invalidateTeacherWrite(teacherId, profile.userId);
    } catch (cacheErr) {
      logger.error("Failed to invalidate teacher cache tags", { teacherId, userId: profile.userId, error: cacheErr });
    }

    return toMaskedTeacherProfile(profile);
  }

  export async function getTeacherProfileForView(
    actorUserId: string,
    teacherId: string,
    locale?: string
  ): Promise<TeacherProfileReturnType> {
    const viewOtherKeys = PROFILE_FIELD_GROUPS.map(group => group.viewOther);
    assertPermission(await PermissionsService.hasAnyPermission(actorUserId, viewOtherKeys), locale);

    const profile = await fetchTeacherProfileOrThrow(teacherId, locale);
    return toMaskedTeacherProfile(profile);
  }

  export async function getTeacherProfileForEdit(
    actorUserId: string,
    teacherId: string,
    locale?: string
  ): Promise<TeacherProfileReturnType> {
    assertPermission(
      await PermissionsService.hasPermission(actorUserId, AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER),
      locale
    );

    const profile = await fetchTeacherProfileOrThrow(teacherId, locale);
    return toMaskedTeacherProfile(profile);
  }
}
