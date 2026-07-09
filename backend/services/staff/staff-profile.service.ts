import { TeacherRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { TeacherProfileReturnType, TeacherProfileUpdateInputType } from "@/backend/types/teacher.types";

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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const { timezone: timezoneInput, ...restInput } = input;

    if (timezoneInput != null) {
      const teacher = await TeacherRepository.findById(teacherId);
      if (!teacher) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("teacherNotFound", { id: teacherId }));
      }
      await UserRepository.updateTimezone(teacher.userId, timezoneInput, undefined, locale);
    }

    const success = await TeacherRepository.updateTeacherProfile(teacherId, restInput);

    if (!success) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherNotFound", { id: teacherId }));
    }

    const profile = await TeacherRepository.getTeacherProfileForEdit(teacherId);
    if (!profile) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherNotFound", { id: teacherId }));
    }

    return toMaskedTeacherProfile(profile);
  }

  export async function getTeacherProfileForEdit(
    actorUserId: string,
    teacherId: string,
    locale?: string
  ): Promise<TeacherProfileReturnType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const profile = await TeacherRepository.getTeacherProfileForEdit(teacherId);
    if (!profile) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherNotFound", { id: teacherId }));
    }

    return toMaskedTeacherProfile(profile);
  }
}
