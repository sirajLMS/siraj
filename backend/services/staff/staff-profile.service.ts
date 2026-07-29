import { TeacherRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { TeacherProfileReturnType, TeacherProfileUpdateInputType } from "@/backend/types/teachers/teacher.types";
import { getServerTranslations } from "@/shared/locale";

function maskNationalId(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }
  const maskedPrefix = "*".repeat(Math.min(trimmed.length - 4, 8));
  return `${maskedPrefix}${trimmed.slice(-4)}`;
}

function toMaskedTeacherProfile(profile: TeacherProfileReturnType): TeacherProfileReturnType {
  return {
    ...profile,
    nationalId: maskNationalId(profile.nationalId),
  };
}

export namespace StaffProfileService {
  export async function updateTeacherProfile(
    actorUserId: string,
    teacherId: string,
    input: TeacherProfileUpdateInputType,
    locale?: string
  ): Promise<TeacherProfileReturnType> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER
    );
    if (!hasPermission) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    const { timezone: timezoneInput, status, ...restInput } = input;

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

    const success = await TeacherRepository.updateTeacherProfile(teacherId, restInput);

    if (!success) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.teacherNotFound(teacherId));
    }

    const profile = await TeacherRepository.getTeacherProfileForEdit(teacherId);
    if (!profile) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.teacherNotFound(teacherId));
    }

    return toMaskedTeacherProfile(profile);
  }

  export async function getTeacherProfileForEdit(
    actorUserId: string,
    teacherId: string,
    locale?: string
  ): Promise<TeacherProfileReturnType> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER
    );
    if (!hasPermission) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    const profile = await TeacherRepository.getTeacherProfileForEdit(teacherId);
    if (!profile) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.teacherNotFound(teacherId));
    }

    return toMaskedTeacherProfile(profile);
  }
}
