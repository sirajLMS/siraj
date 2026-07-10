"use client";

import { Alert } from "@mui/material";
import { useTranslations } from "next-intl";
import { useUserStore } from "@/frontend/stores/userStore";

export function FxConversionNote(): React.ReactNode {
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const t = useTranslations("dashboard.billing");

  if (!displayCurrency) {
    return null;
  }

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      {t("fxConversionNote", { code: displayCurrency })}
    </Alert>
  );
}
