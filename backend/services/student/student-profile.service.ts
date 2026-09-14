import { StudentRepository } from "@/backend/db/repo/students";
import { UserRepository } from "@/backend/db/repo/users";
import { type AppLanguage, type Gender, StudentStatus } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StudentHistoryService } from "@/backend/services/history/student-history.service";
import {
  canEditStudentFieldGroup,
  filterStudentProfileByFieldGroups,
} from "@/backend/services/profile/profile-field-filter";
import { assertStudentReadAccess, resolveIsAssociatedViewer } from "@/backend/services/student/student-access.helpers";
import { StudentStatusService } from "@/backend/services/student/student-status.service";
import type {
  StudentFieldFilterContext,
  StudentProfileCoreReturnType,
  StudentProfileEditInput,
  StudentProfileReturnType,
} from "@/backend/types";
import {
  parseAppLanguage,
  parseCurrencyCodeOrNull,
  parseGender,
  parseIanaTimezone,
  parseStudentStatus,
} from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

type GetProfileOptions = {
  readonly year?: number | null;
  readonly month?: number | null;
  readonly includeUpcomingClasses?: boolean;
};

function mapProfileRow(
  row: NonNullable<Awaited<ReturnType<typeof StudentRepository.findProfileById>>>
): StudentProfileCoreReturnType {
  return {
    id: row.id,
    name: row.name,
    status: parseStudentStatus(row.status) ?? StudentStatus.REGULAR,
    avatarUrl: row.avatarUrl,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender ? (parseGender(row.gender) ?? null) : null,
    language: row.language ? (parseAppLanguage(row.language) ?? null) : null,
    timezoneOverride: row.timezoneOverride,
    email: row.email,
    phone: row.phone,
    timezone: parseIanaTimezone(row.timezone),
    displayCurrency: row.displayCurrency ? parseCurrencyCodeOrNull(row.displayCurrency) : null,
    parentId: row.parentId,
    parentUserId: row.parentUserId,
    parentName: row.parentName,
    parentEmail: row.parentEmail,
    parentPhone: row.parentPhone,
    primaryTeacherId: row.primaryTeacherId,
    teacherUserId: row.teacherUserId,
    teacherName: row.teacherName,
    hoursPerWeek: row.hoursPerWeek ? Number(row.hoursPerWeek) : null,
    classesRemaining: row.classesRemaining,
    classesTotal: row.classesTotal,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export namespace StudentProfileService {
  export async function getProfile(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels,
    options: GetProfileOptions = {}
  ): Promise<StudentProfileReturnType> {
    await assertStudentReadAccess(actorUserId, studentId, tErrors);

    const row = await StudentRepository.findProfileById(studentId);
    if (!row) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    const isAssociatedViewer = await resolveIsAssociatedViewer(actorUserId, studentId);
    const isOwnStudentProfile = row.userId === actorUserId;
    const permissionContext = await PermissionsService.getUserContext(actorUserId);
    const filterCtx: StudentFieldFilterContext = {
      actorUserId,
      studentId,
      studentUserId: row.userId,
      permissions: new Set(permissionContext.permissions),
    };

    let upcomingClasses: Awaited<ReturnType<typeof StudentStatusService.getUpcomingClasses>> | null = null;
    if (options.includeUpcomingClasses !== false) {
      try {
        upcomingClasses = await StudentStatusService.getUpcomingClasses(actorUserId, studentId, tErrors);
      } catch {
        upcomingClasses = null;
      }
    }

    let classHistory = null;
    if (options.year != null && options.month != null) {
      try {
        classHistory = await StudentHistoryService.getStudentClassHistory(
          actorUserId,
          studentId,
          options.year,
          options.month,
          tErrors
        );
      } catch {
        classHistory = null;
      }
    }

    return filterStudentProfileByFieldGroups(
      {
        ...mapProfileRow(row),
        isAssociatedViewer,
        isOwnStudentProfile,
        upcomingClasses,
        classHistory,
      },
      filterCtx
    );
  }

  /**
   * Updates editable student profile fields for own profile (omit studentId) or a target student (studentId).
   * Gated by fine-grained student field-group edit_own / edit_other permissions.
   */
  export async function recordStudentProfileEdit(
    actorUserId: string,
    input: StudentProfileEditInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<StudentProfileReturnType> {
    const targetStudentId = input.studentId?.trim()
      ? input.studentId.trim()
      : await resolveOwnStudentId(actorUserId, tErrors);

    const profile = await StudentRepository.findProfileById(targetStudentId);
    if (!profile) {
      throw new Error(tErrors.studentNotFound(targetStudentId));
    }

    const submittedGroups = collectStudentProfileEditGroups(input);
    if (submittedGroups.length === 0) {
      throw new Error(tErrors.invalidInput);
    }

    await assertCanEditSubmittedGroups(actorUserId, targetStudentId, profile.userId, submittedGroups, tErrors);
    await applyStudentProfileEdit(profile.userId, targetStudentId, profile, input, tErrors, locale);

    return getProfile(actorUserId, targetStudentId, tErrors, {});
  }
}

async function resolveOwnStudentId(actorUserId: string, tErrors: ErrorsLabels): Promise<string> {
  const studentId = await StudentRepository.getStudentIdByUserId(actorUserId);
  if (!studentId) {
    throw new Error(tErrors.studentNotFound(actorUserId));
  }
  return studentId;
}

async function assertCanEditSubmittedGroups(
  actorUserId: string,
  studentId: string,
  studentUserId: string,
  submittedGroups: readonly string[],
  tErrors: ErrorsLabels
): Promise<void> {
  const permissionContext = await PermissionsService.getUserContext(actorUserId);
  const filterCtx: StudentFieldFilterContext = {
    actorUserId,
    studentId,
    studentUserId,
    permissions: new Set(permissionContext.permissions),
  };

  for (const groupKey of submittedGroups) {
    if (!canEditStudentFieldGroup(filterCtx, groupKey)) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }
}

async function applyStudentProfileEdit(
  studentUserId: string,
  studentId: string,
  profile: NonNullable<Awaited<ReturnType<typeof StudentRepository.findProfileById>>>,
  input: StudentProfileEditInput,
  tErrors: ErrorsLabels,
  locale?: string
): Promise<void> {
  const identityUpdates: {
    dateOfBirth?: Date | null;
    gender?: Gender | null;
    language?: AppLanguage | null;
    timezoneOverride?: string | null;
    avatarUrl?: string | null;
  } = {};

  if ("dateOfBirth" in input) {
    identityUpdates.dateOfBirth = input.dateOfBirth;
  }
  if ("gender" in input) {
    identityUpdates.gender = input.gender;
  }
  if ("language" in input) {
    identityUpdates.language = input.language;
  }
  if ("timezoneOverride" in input) {
    identityUpdates.timezoneOverride = input.timezoneOverride;
  }
  if ("avatarUrl" in input) {
    identityUpdates.avatarUrl = input.avatarUrl;
  }

  if (Object.keys(identityUpdates).length > 0) {
    await StudentRepository.partiallyUpdate(
      {
        id: studentId,
        ...identityUpdates,
      },
      tErrors,
      locale
    );
  }

  if (input.phone !== undefined) {
    await UserRepository.updateProfileFields(studentUserId, { phone: input.phone }, locale);
  }

  if (input.timezone !== undefined && input.timezone) {
    await UserRepository.updateTimezone(studentUserId, input.timezone, undefined, locale);
  }

  if (input.displayCurrency !== undefined) {
    await UserRepository.updateProfileFields(studentUserId, { displayCurrency: input.displayCurrency }, locale);
  }

  if (input.parentPhone !== undefined) {
    if (!profile.parentUserId) {
      throw new Error(tErrors.invalidInput);
    }
    await UserRepository.updateProfileFields(profile.parentUserId, { phone: input.parentPhone }, locale);
  }
}

function collectStudentProfileEditGroups(input: StudentProfileEditInput): string[] {
  const groups: string[] = [];

  // Phone, timezone, and displayCurrency live on users but are gated with identity edit_own.
  if (
    "phone" in input ||
    "timezone" in input ||
    "displayCurrency" in input ||
    "dateOfBirth" in input ||
    "gender" in input ||
    "language" in input ||
    "avatarUrl" in input
  ) {
    groups.push("student_identity");
  }

  if ("timezoneOverride" in input) {
    groups.push("student_identity");
  }

  if ("parentPhone" in input) {
    groups.push("student_parent");
  }

  return groups;
}
