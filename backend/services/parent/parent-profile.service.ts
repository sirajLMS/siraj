import { ParentRepository } from "@/backend/db/repo/parents";
import { SessionRepository } from "@/backend/db/repo/shared";
import { UserRepository } from "@/backend/db/repo/users";
import { AppPermission, StudentStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services";
import { FxDisplayService } from "@/backend/services/billing/fx-display.service";
import { invalidateParentWrite } from "@/backend/services/cache";
import type {
  AssociatedStudentResult,
  DeactivateParentResult,
  ParentOwnProfileUpdateInput,
  ParentProfileResult,
  ParentProfileUpdateInput,
  ReactivateParentResult,
} from "@/backend/types";
import { parseStudentStatus } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

export type {
  AssociatedStudentResult,
  DeactivateParentResult,
  ParentProfileResult,
  ReactivateParentResult,
} from "@/backend/types";

type ParentProfileRepoResult = NonNullable<Awaited<ReturnType<typeof ParentRepository.getParentProfile>>>;

async function toParentProfileResult(profile: ParentProfileRepoResult, locale?: string): Promise<ParentProfileResult> {
  const displayAmount = await FxDisplayService.convertForDisplay(
    profile.feeAmount,
    profile.currency,
    profile.displayCurrency,
    profile.id,
    undefined,
    locale
  );

  return {
    ...profile,
    displayAmount,
  };
}

async function requirePermission(actorUserId: string, permission: AppPermission, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
  if (!hasPermission) {
    const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
    throw new Error(tFunc.insufficientPermissions);
  }
}

async function requireParentProfile(parentId: string, locale: string | undefined): Promise<ParentProfileRepoResult> {
  const profile = await ParentRepository.getParentProfile(parentId);
  if (!profile) {
    const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
    throw new Error(tFunc.parentNotFound);
  }
  return profile;
}

async function requireStudent(
  studentId: string,
  locale: string | undefined
): Promise<NonNullable<Awaited<ReturnType<typeof ParentRepository.getAssociatedStudentById>>>> {
  const student = await ParentRepository.getAssociatedStudentById(studentId);
  if (!student) {
    const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
    throw new Error(tFunc.studentNotFound(studentId));
  }
  return student;
}

function toStudentResult(student: {
  id: string;
  name: string;
  studentAvatarUrl: string | null;
  status: string;
  primaryTeacherId: string | null;
  teacherUserId: string | null;
  teacherName: string | null;
  hoursPerWeek: string;
  classesRemaining: number;
  classesTotal: number;
  language: string | null;
  gender: string | null;
  version: number;
  updatedAt: Date;
}): AssociatedStudentResult {
  return {
    id: student.id,
    name: student.name,
    avatarUrl: student.studentAvatarUrl,
    status: parseStudentStatus(student.status) ?? StudentStatus.REGULAR,
    primaryTeacherId: student.primaryTeacherId,
    teacherUserId: student.teacherUserId,
    teacherName: student.teacherName,
    hoursPerWeek: student.hoursPerWeek,
    classesRemaining: student.classesRemaining,
    classesTotal: student.classesTotal,
    language: student.language,
    gender: student.gender,
    version: student.version,
    updatedAt: student.updatedAt,
  };
}

async function invalidateParentCacheFailOpen(parentId: string, userId: string): Promise<void> {
  try {
    await invalidateParentWrite(parentId, userId);
  } catch (cacheErr) {
    logger.error("Failed to invalidate parent cache tags", { parentId, userId, error: cacheErr });
  }
}

export namespace ParentProfileService {
  /**
   * Retrieves the full profile for a specific parent.
   * Requires any fine-grained profile.parent_* / profile.core_* view_other permission.
   */
  export async function getProfile(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ParentProfileResult> {
    const canView = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
      AppPermission.PROFILE_CORE_CONTACT_VIEW_OTHER,
      AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OTHER,
      AppPermission.PROFILE_PARENT_IDENTITY_VIEW_OTHER,
      AppPermission.PROFILE_PARENT_BILLING_VIEW_OTHER,
      AppPermission.PROFILE_PARENT_ACCOUNT_VIEW_OTHER,
      AppPermission.PROFILE_PARENT_STUDENTS_VIEW_OTHER,
    ]);
    if (!canView) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    const profile = await requireParentProfile(parentId, locale);

    return toParentProfileResult(profile, locale);
  }

  /**
   * Returns the list of students associated with a parent.
   * Requires: student.view_associated permission.
   */
  export async function getAssociatedStudents(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<AssociatedStudentResult[]> {
    await requirePermission(actorUserId, AppPermission.STUDENT_VIEW_ASSOCIATED, locale);

    const students = await ParentRepository.getAssociatedStudents(parentId);
    return students.map(toStudentResult);
  }

  /**
   * Returns a single student's profile data by studentId.
   * Requires: student.view_associated permission.
   */
  export async function getStudentById(
    actorUserId: string,
    studentId: string,
    locale?: string
  ): Promise<AssociatedStudentResult> {
    await requirePermission(actorUserId, AppPermission.STUDENT_VIEW_ASSOCIATED, locale);

    const student = await requireStudent(studentId, locale);

    return toStudentResult(student);
  }

  /**
   * Deactivates a parent account by setting status to DEACTIVATED.
   * Requires: parent.manage_status permission.
   * Also invalidates all active sessions for the parent's userId.
   */
  export async function deactivateAccount(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<DeactivateParentResult> {
    await requirePermission(actorUserId, AppPermission.PARENT_MANAGE_STATUS, locale);

    const result = await ParentRepository.deactivateParent(parentId, undefined, locale);

    // Invalidate all active Redis sessions for this parent's user account.
    // Session invalidation failure is logged but does NOT roll back the deactivation —
    // the status change is authoritative.
    try {
      await SessionRepository.deleteByUserId(result.userId);
    } catch (sessionError) {
      logger.error("Failed to invalidate sessions after parent deactivation", {
        parentId,
        userId: result.userId,
        error: sessionError,
      });
    }

    await invalidateParentCacheFailOpen(parentId, result.userId);

    return {
      id: result.id,
      userId: result.userId,
      accountStatus: result.accountStatus,
    };
  }

  /**
   * Reactivates a parent account by setting status to ACTIVATED.
   * Requires: parent.manage_status permission.
   */
  export async function reactivateAccount(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ReactivateParentResult> {
    await requirePermission(actorUserId, AppPermission.PARENT_MANAGE_STATUS, locale);

    const result = await ParentRepository.reactivateParent(parentId, undefined, locale);

    await invalidateParentCacheFailOpen(parentId, result.userId);

    return {
      id: result.id,
      userId: result.userId,
      accountStatus: result.accountStatus,
    };
  }

  /**
   * Updates own parent profile fields (contact/social only).
   * Requires any fine-grained profile.core_* / profile.parent_social edit_own permission.
   */
  export async function updateOwnProfile(
    actorUserId: string,
    parentId: string,
    input: ParentOwnProfileUpdateInput,
    locale?: string
  ): Promise<ParentProfileResult> {
    const canEdit = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
      AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN,
      AppPermission.PROFILE_PARENT_SOCIAL_EDIT_OWN,
    ]);
    if (!canEdit) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (parent?.id !== parentId) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    const { phone, ...repoInput } = input;
    if (phone !== undefined) {
      await UserRepository.updateProfileFields(actorUserId, { phone }, locale);
    }

    const updated = await ParentRepository.updateParentProfile(parentId, repoInput, locale);

    try {
      await invalidateParentWrite(parentId, actorUserId);
    } catch (cacheErr) {
      logger.error("Failed to invalidate parent cache tags", { parentId, userId: actorUserId, error: cacheErr });
    }

    return toParentProfileResult(updated);
  }

  /**
   * Updates a parent profile (admin/staff).
   * Requires: parents.edit permission.
   */
  export async function updateProfile(
    actorUserId: string,
    parentId: string,
    input: ParentProfileUpdateInput,
    locale?: string
  ): Promise<ParentProfileResult> {
    await requirePermission(actorUserId, AppPermission.PARENTS_EDIT, locale);

    const { timezone, phone, ...repoInput } = input;
    if (phone !== undefined) {
      const existing = await requireParentProfile(parentId, locale);
      await UserRepository.updateProfileFields(existing.userId, { phone }, locale);
    }
    if (timezone != null) {
      const existing = await requireParentProfile(parentId, locale);
      await UserRepository.updateTimezone(existing.userId, timezone, undefined, locale);
    }

    const updated = await ParentRepository.updateParentProfile(parentId, repoInput, locale);

    try {
      await invalidateParentWrite(parentId, updated.userId);
    } catch (cacheErr) {
      logger.error("Failed to invalidate parent cache tags", { parentId, userId: updated.userId, error: cacheErr });
    }

    return toParentProfileResult(updated);
  }
}
