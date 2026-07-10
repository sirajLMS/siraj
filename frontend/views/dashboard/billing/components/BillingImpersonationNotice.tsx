"use client";

import { Alert } from "@mui/material";
import { useTranslations } from "next-intl";
import { useImpersonation } from "@/frontend/hooks/useImpersonation";

export function BillingImpersonationNotice(): React.ReactNode {
  const { isImpersonating } = useImpersonation();
  const t = useTranslations("errors.auth");

  if (!isImpersonating) {
    return null;
  }

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {t("impersonationNotAllowedDuringSession")}
    </Alert>
  );
}
