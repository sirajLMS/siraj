import { ParentRepository, SessionRepository, UserRepository } from "@/backend/db";
import { AppPermission, StudentStatus } from "@/backend/enum";
import { getBackendTranslations, logger } from "@/backend/lib";
import { parseStudentStatus } from "@/backend/lib/enum";
import { PermissionsService } from "@/backend/services";
import type {
  AssociatedStudentResult,
  DeactivateParentResult,
  ParentOwnProfileUpdateInput,
  ParentProfileResult,
  ParentProfileUpdateInput,
  ReactivateParentResult,
} from "@/backend/types";

export type {
  AssociatedStudentResult,
  DeactivateParentResult,
  ParentProfileResult,
  ReactivateParentResult,
} from "@/backend/types";

type ParentProfileRepoResult = NonNullable<Awaited<ReturnType<typeof ParentRepository.getParentProfile>>>;

async function toParentProfileResult(profile: ParentProfileRepoResult): Promise<ParentProfileResult> {
  return profile;
}

async function requirePermission(actorUserId: string, permission: AppPermission, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
  if (!hasPermission) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }
}

async function requireParentProfile(parentId: string, locale: string | undefined): Promise<ParentProfileRepoResult> {
  const profile = await ParentRepository.getParentProfile(parentId);
  if (!profile) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("parentNotFound", { id: parentId }));
  }
  return profile;
}

async function requireStudent(
  studentId: string,
  locale: string | undefined
): Promise<NonNullable<Awaited<ReturnType<typeof ParentRepository.getAssociatedStudentById>>>> {
  const student = await ParentRepository.getAssociatedStudentById(studentId);
  if (!student) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("studentNotFound", { id: studentId }));
  }
  return student;
}

function toStudentResult(student: { status: string }): AssociatedStudentResult {
  return {
    ...student,
    status: parseStudentStatus(student.status) ?? StudentStatus.REGULAR,
  } as AssociatedStudentResult;
}

export namespace ParentProfileService {
  /**
   * Retrieves the full profile for a specific parent.
   * Requires: parent.view_profile permission.
   */
  export async function getProfile(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ParentProfileResult> {
    await requirePermission(actorUserId, AppPermission.PARENT_VIEW_PROFILE, locale);

    const profile = await requireParentProfile(parentId, locale);

    return toParentProfileResult(profile);
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

    return {
      id: result.id,
      userId: result.userId,
      accountStatus: result.accountStatus,
    };
  }

  /**
   * Updates own parent profile fields (contact/social only).
   * Requires: parent.edit_own_profile permission.
   */
  export async function updateOwnProfile(
    actorUserId: string,
    parentId: string,
    input: ParentOwnProfileUpdateInput,
    locale?: string
  ): Promise<ParentProfileResult> {
    await requirePermission(actorUserId, AppPermission.PARENT_EDIT_OWN_PROFILE, locale);

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (parent?.id !== parentId) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const { phone, ...repoInput } = input;
    if (phone !== undefined) {
      await UserRepository.updateProfileFields(actorUserId, { phone }, locale);
    }

    const updated = await ParentRepository.updateParentProfile(parentId, repoInput, locale);
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
    return toParentProfileResult(updated);
  }
}
