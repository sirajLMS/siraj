"use client";

import { Alert } from "@mui/material";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { useAppTranslation } from "@/shared/locale";

export function BillingImpersonationNotice(): React.ReactNode {
  const { isImpersonating } = useImpersonation();
  const t = useAppTranslation().errorsTranslations;
  const auth = t.auth;

  if (!isImpersonating) {
    return null;
  }

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {auth.impersonationNotAllowedDuringSession}
    </Alert>
  );
}
