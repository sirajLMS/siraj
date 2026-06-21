import { TeacherRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface TeacherProfileUpdateInput {
  readonly nationalId?: string | null;
  readonly phone?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: string | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly skypeId?: string | null;
  readonly zoomLink?: string | null;
  readonly zoomUsername?: string | null;
  readonly zoomPassword?: string | null;
  readonly timezone?: string | null;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: string | null;
}

export interface TeacherProfileResult {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly nationalId: string | null;
  readonly dateOfBirth: string | null;
  readonly gender: string | null;
  readonly address: string | null;
  readonly qualifications: string | null;
  readonly skypeId: string | null;
  readonly zoomLink: string | null;
  readonly zoomUsername: string | null;
  readonly timezone: string;
  readonly hourlyRate: string | null;
  readonly rateCurrency: string | null;
  readonly status: string;
}

export namespace StaffProfileService {
  /**
   * Updates a teacher's profile with PII, salary, and official details.
   * Requires: staff.edit_profile permission.
   */
  export async function updateTeacherProfile(
    actorUserId: string,
    teacherId: string,
    input: TeacherProfileUpdateInput,
    locale?: string
  ): Promise<TeacherProfileResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    // Adapt dateOfBirth to Date if it exists
    const updateInput: Record<string, unknown> = { ...input };
    if (input.dateOfBirth) {
      updateInput.dateOfBirth = input.dateOfBirth;
    }
    if (input.gender) {
      updateInput.gender = input.gender.toUpperCase();
    }

    const success = await TeacherRepository.updateTeacherProfile(teacherId, updateInput);

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

  /**
   * Retrieves a teacher's full profile for editing.
   * Requires: staff.edit_profile permission.
   */
  export async function getTeacherProfileForEdit(
    actorUserId: string,
    teacherId: string,
    locale?: string
  ): Promise<TeacherProfileResult> {
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
