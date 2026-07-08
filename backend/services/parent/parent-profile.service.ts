import { ParentRepository, SessionRepository } from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations, logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type {
  AssociatedStudentResult,
  DeactivateParentResult,
  ParentOwnProfileUpdateInput,
  ParentProfileResult,
  ParentProfileUpdateInput,
} from "@/backend/types";

export type {
  AssociatedStudentResult,
  DeactivateParentResult,
  ParentProfileResult,
} from "@/backend/types";

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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_VIEW_PROFILE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const profile = await ParentRepository.getParentProfile(parentId);
    if (!profile) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { id: parentId }));
    }

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      status: profile.status,
      phone: profile.phone,
      nationality: profile.nationality,
      address: profile.address,
      facebook: profile.facebook,
      whatsapp: profile.whatsapp,
      twitter: profile.twitter,
      defaultZoomLink: profile.defaultZoomLink,
      invoiceType: profile.invoiceType,
      feeAmount: profile.feeAmount,
      paymentMethod: profile.paymentMethod,
      currency: profile.currency,
      timezone: profile.timezone,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_VIEW_ASSOCIATED);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return ParentRepository.getAssociatedStudents(parentId);
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_VIEW_ASSOCIATED);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const student = await ParentRepository.getAssociatedStudentById(studentId);
    if (!student) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    return student;
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_MANAGE_STATUS);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

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
      status: result.status,
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_EDIT_OWN_PROFILE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (parent?.id !== parentId) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return ParentRepository.updateParentProfile(parentId, input, locale);
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENTS_EDIT);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return ParentRepository.updateParentProfile(parentId, input, locale);
  }
}
