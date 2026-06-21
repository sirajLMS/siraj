import { ParentRepository, SessionRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface ParentProfileResult {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly status: string;
  readonly phone: string | null;
  readonly nationality: string | null;
  readonly address: string | null;
  readonly facebook: string | null;
  readonly whatsapp: string | null;
  readonly twitter: string | null;
  readonly skype: string | null;
  readonly defaultZoomLink: string | null;
  readonly invoiceType: string | null;
  readonly feeAmount: string | null;
  readonly paymentMethod: string | null;
  readonly currency: string | null;
  readonly timezone: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AssociatedStudentResult {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly primaryTeacherId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly language: string | null;
  readonly gender: string | null;
  readonly updatedAt: Date;
}

export interface DeactivateParentResult {
  readonly id: string;
  readonly userId: string;
  readonly status: string;
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
      skype: profile.skype,
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
}
