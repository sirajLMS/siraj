import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { FxDisplayService } from "@/backend/services/billing/fx-display.service";
import { invalidateTeacherWrite } from "@/backend/services/cache";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type {
  TeacherAssignedClassesResult,
  TeacherAssignedStudentsResult,
  TeacherOwnProfileReturnType,
  TeacherOwnProfileUpdateInput,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { isValidNationalIdForCountry } from "@/shared/lib/national-id";
import type { ErrorsLabels } from "@/shared/locale";

export namespace TeacherPortalService {
  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  async function resolveTeacherForUser(userId: string, tErrors: ErrorsLabels) {
    const teacher = await TeacherRepository.findByUserId(userId);
    if (!teacher) {
      throw new Error(tErrors.notFound);
    }
    return teacher;
  }

  export async function listAssignedStudents(
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<TeacherAssignedStudentsResult> {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_STUDENTS, tErrors);
    const teacher = await resolveTeacherForUser(userId, tErrors);
    return StudentRepository.getAssignedToTeacher(teacher.id);
  }

  export async function getOwnProfile(
    userId: string,
    tErrors: ErrorsLabels,
    displayCurrency?: CurrencyCode | null,
    locale?: string
  ): Promise<TeacherOwnProfileReturnType> {
    await assertPermission(userId, AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN, tErrors);
    const teacher = await resolveTeacherForUser(userId, tErrors);
    const profile = await TeacherRepository.getTeacherProfileForEdit(teacher.id);
    if (!profile) {
      throw new Error(tErrors.notFound);
    }

    const displayAmount = await FxDisplayService.convertForDisplay(
      profile.hourlyRate,
      profile.rateCurrency,
      displayCurrency,
      profile.id,
      undefined,
      locale
    );

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      nationality: profile.nationality,
      countryCode: profile.countryCode,
      // Returned UNMASKED to the owner (the teacher editing their own profile).
      // Admin/other-scope views go through StaffProfileService which masks it.
      nationalId: profile.nationalId,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      address: profile.address,
      qualifications: profile.qualifications,
      timezone: profile.timezone,
      hourlyRate: profile.hourlyRate,
      rateCurrency: profile.rateCurrency,
      totalClasses: profile.totalClasses,
      displayAmount,
    };
  }

  export async function listAssignedClasses(
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<TeacherAssignedClassesResult> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, tErrors);
    const teacher = await resolveTeacherForUser(userId, tErrors);
    const rows = await SchedulingRepository.getTeacherAssignedClasses(teacher.id);

    const enrichedRows = await Promise.all(
      rows.map(async row => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(row.id, tErrors);
        return {
          id: row.id,
          studentName: row.studentName,
          scheduledStartAt: row.scheduledStartAt.toISOString(),
          scheduledEndAt: row.scheduledEndAt.toISOString(),
          durationMinutes: row.durationMinutes,
          executionState: row.executionState,
          outcome: row.outcome,
          isFrozen: row.isFrozen,
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
        };
      })
    );

    return {
      rows: enrichedRows,
      totalCount: enrichedRows.length,
    };
  }

  export async function resolveTeacherIdForUser(userId: string): Promise<string | null> {
    const teacher = await TeacherRepository.findByUserId(userId);
    return teacher?.id ?? null;
  }

  export async function resolveTeacherIdsForUsers(userIds: string[]): Promise<Map<string, string | null>> {
    return TeacherRepository.findByUserIds(userIds);
  }

  export async function updateOwnProfile(
    userId: string,
    teacherId: string,
    input: TeacherOwnProfileUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<TeacherOwnProfileReturnType> {
    const canEditOwn = await PermissionsService.hasAnyPermission(userId, [
      AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
      AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN,
      AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN,
    ]);
    if (!canEditOwn) {
      throw new Error(tErrors.unauthorizedAction);
    }
    const teacher = await resolveTeacherForUser(userId, tErrors);

    if (teacher.id !== teacherId) {
      throw new Error(tErrors.unauthorizedAction);
    }

    if (input.timezone) {
      await UserRepository.updateTimezone(userId, input.timezone);
    }

    // Validate national ID format against the (possibly updated) nationality.
    // When nationalId is provided we use the incoming nationality if present,
    // otherwise fall back to the teacher's existing nationality so a teacher
    // can fix their national ID without first re-selecting their country.
    if (input.nationalId != null && input.nationalId.trim() !== "") {
      const effectiveNationality = input.nationality ?? teacher.nationality;
      if (!isValidNationalIdForCountry(input.nationalId, effectiveNationality)) {
        throw new Error(tErrors.invalidNationalId);
      }
    }

    const success = await TeacherRepository.updateTeacherProfile(teacherId, {
      phone: input.phone ?? undefined,
      nationality: input.nationality ?? undefined,
      countryCode: input.countryCode ?? undefined,
      nationalId: input.nationalId ?? undefined,
      dateOfBirth: input.dateOfBirth ?? undefined,
      gender: input.gender ?? undefined,
      address: input.address ?? undefined,
      qualifications: input.qualifications ?? undefined,
    });

    if (!success) {
      throw new Error(tErrors.notFound);
    }

    try {
      await invalidateTeacherWrite(teacherId, userId);
    } catch (cacheErr) {
      logger.error("Failed to invalidate teacher cache tags", { teacherId, userId, error: cacheErr });
    }

    return getOwnProfile(userId, tErrors);
  }
}
