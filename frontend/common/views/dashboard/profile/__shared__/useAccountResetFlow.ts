"use client";

import { useState } from "react";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { ProfileScope } from "@/shared/constants/profile.enum";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useAccountResetFlow(scope: ProfileScope | undefined) {
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canView, canAdminResetPassword } = useProfileFieldAccess({ scope });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const { resetPassword, loading: resetLoading } = useAdminResetPassword(
    tBase.adminResetPassword.success,
    tBase.adminResetPassword.error
  );

  return {
    tBase,
    canView,
    canAdminResetPassword,
    resetPasswordOpen,
    setResetPasswordOpen,
    sendEmail,
    setSendEmail,
    resetPassword,
    resetLoading,
  };
}
