"use client";

import { Alert, Button } from "@mui/material";
import { useTranslations } from "next-intl";
import { useUserStore } from "@/frontend/stores/userStore";
import { Link } from "@/shared/i18n/routing";

export function DisplayCurrencyHint(): React.ReactNode {
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const t = useTranslations("dashboard.billing.displayCurrencyHint");

  if (displayCurrency) {
    return null;
  }

  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button component={Link} href="/profile/edit" color="inherit" size="small">
          {t("cta")}
        </Button>
      }
    >
      <strong>{t("title")}</strong>
      <br />
      {t("body")}
    </Alert>
  );
}
