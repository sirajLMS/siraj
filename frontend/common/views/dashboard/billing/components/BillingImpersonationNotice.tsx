"use client";

import { Alert } from "@mui/material";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { Translation, useAppTranslation } from "@/shared/locale";

export function BillingImpersonationNotice(): React.ReactNode {
  const { isImpersonating } = useImpersonation();
  const t = useAppTranslation(Translation.Errors);
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
