import { SessionRepository } from "@/backend/db/repo";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { AppPermission } from "@/backend/enum";
import { NotificationChannel, NotificationEventType } from "@/backend/enum/notifications/notificationDeliveries.enum";
import { comparePassword, hashPassword, validatePasswordStrength } from "@/backend/lib/auth/password";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AuditService } from "@/backend/services/system/audit.service";
import type { AdminResetPasswordInput, AdminResetPasswordResult, ChangePasswordInput } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace AuthPasswordService {
  export async function changePassword(userId: string, input: ChangePasswordInput, locale?: string): Promise<boolean> {
    const tErrors = getServerTranslations(locale ?? "ar").errorsTranslations;

    if (input.newPassword !== input.confirmPassword) {
      throw new Error(tErrors.auth.passwordsDoNotMatch);
    }

    const user = await UserRepository.findUserByIdOrThrow(userId, locale);
    const isCurrentValid = await comparePassword(input.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new Error(tErrors.auth.currentPasswordInvalid);
    }

    await validatePasswordStrength(input.newPassword, locale);

    const hashedNewPassword = await hashPassword(input.newPassword);
    await UserRepository.updatePassword(userId, hashedNewPassword, undefined, locale);

    // Revoke all sessions for the user so the rotated password forces re-authentication.
    await SessionRepository.deleteByUserId(userId);

    return true;
  }

  export async function adminResetPassword(
    actorUserId: string,
    targetUserId: string,
    input: AdminResetPasswordInput,
    locale?: string
  ): Promise<AdminResetPasswordResult> {
    const tErrors = getServerTranslations(locale ?? "ar").errorsTranslations;

    // Permission check
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.USER_ADMIN_RESET_PASSWORD);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    // Self-restriction
    if (actorUserId === targetUserId) {
      throw new Error(tErrors.auth.cannotResetOwnPasswordViaAdmin);
    }

    // Validate target user exists
    await UserRepository.findUserByIdOrThrow(targetUserId, locale);

    // Validate password strength
    await validatePasswordStrength(input.newPassword, locale);

    // Hash and update
    const hashedPassword = await hashPassword(input.newPassword);
    await UserRepository.updatePassword(targetUserId, hashedPassword, undefined, locale);

    // Revoke all sessions for the target user so the old password stops working immediately.
    await SessionRepository.deleteByUserId(targetUserId);

    // Audit log
    const emailSent = input.sendNotificationEmail ?? true;
    await AuditService.createManyAdminAuditLogs([
      {
        actorUserId,
        targetUserId,
        action: "USER_PASSWORD_RESET_BY_ADMIN",
        description: `Admin reset password for user ${targetUserId}`,
        newState: { emailSent },
      },
    ]);

    // Optional email notification
    let notificationEmailSent = false;
    if (emailSent) {
      try {
        await CommunicationService.dispatch(
          {
            userId: targetUserId,
            title: "Your password has been reset by an administrator",
            body: "An administrator has reset your password. Please use the new password provided to log in.",
            eventType: NotificationEventType.PASSWORD_RESET_BY_ADMIN,
            channel: NotificationChannel.EMAIL,
            metadata: { resetByAdmin: true },
          },
          locale
        );
        notificationEmailSent = true;
      } catch (err) {
        // Log error but don't fail the password reset
        // Error is already logged in CommunicationService
        logger.warn("Failed to send password reset notification email", { targetUserId, error: err });
      }
    }

    return {
      success: true,
      emailSent: notificationEmailSent,
      userId: targetUserId,
      message: "Password reset successfully",
    };
  }
}
