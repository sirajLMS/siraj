import type { AdminResetPasswordSectionRef } from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";

export interface ProfileSubmitHandlerOptions<T = unknown> {
  readonly onSubmit: (values: T) => Promise<void>;
  readonly resetPasswordRef: React.RefObject<AdminResetPasswordSectionRef | null>;
  readonly resetPassword: (userId: string, newPassword: string, sendEmail: boolean) => Promise<boolean>;
  readonly targetUserId: string;
  readonly setSuccessOpen: (value: boolean) => void;
  readonly setErrorOpen: (value: boolean) => void;
}

export async function executeProfileSubmit<T = unknown>(
  values: T,
  options: ProfileSubmitHandlerOptions<T>
): Promise<void> {
  const { onSubmit, resetPasswordRef, resetPassword, targetUserId, setSuccessOpen, setErrorOpen } = options;
  try {
    await onSubmit(values);
    const resetData = resetPasswordRef.current?.getResetPasswordData();
    if (resetData?.isValid) {
      const success = await resetPassword(targetUserId, resetData.newPassword, resetData.sendNotificationEmail);
      if (success) {
        resetPasswordRef.current?.reset();
      }
    }
    setSuccessOpen(true);
  } catch {
    setErrorOpen(true);
  }
}
