import { TeacherRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { TeacherProfileReturnType, TeacherProfileUpdateInputType } from "@/backend/types/teacher.types";
import { AppPermission } from "@/shared/lib/enum";

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
    const timezone = timezoneInput ?? undefined;

    if (timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("teacher.invalidTimezone"));
      }
    }

    const repoInput: TeacherProfileUpdateInputType = timezone ? { ...restInput, timezone } : restInput;

    const success = await TeacherRepository.updateTeacherProfile(teacherId, repoInput);

    if (!success) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherNotFound", { id: teacherId }));
    }

    const profile = await TeacherRepository.getTeacherProfileForEdit(teacherId);
    if (!profile) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherNotFound", { id: teacherId }));
    }

    return profile;
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

    return profile;
  }
}
