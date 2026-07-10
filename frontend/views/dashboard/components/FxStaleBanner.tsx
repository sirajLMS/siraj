"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Button } from "@mui/material";
import { useTranslations } from "next-intl";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { fxSyncHealthQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/stores/userStore";
import { Link, usePathname } from "@/shared/i18n/routing";

export function FxStaleBanner(): React.ReactNode {
  const pathname = usePathname();
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const hasPermission = useUserStore(state => state.hasPermission);
  const isAdmin = hasPermission(AppPermission.BillingViewExchangeRates);
  const t = useTranslations("dashboard.billing.fxStaleBanner");

  const { data } = useQuery(fxSyncHealthQueryDocument, {
    fetchPolicy: "cache-and-network",
    skip: !displayCurrency,
  });

  if (!displayCurrency) {
    return null;
  }

  if (pathname.includes("/billing/exchange-rates")) {
    return null;
  }

  const health = data?.fxSyncHealth;
  if (!health?.isStale) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button
          component={Link}
          href={isAdmin ? "/billing/exchange-rates" : "/profile/edit"}
          color="inherit"
          size="small"
        >
          {isAdmin ? t("adminCta") : t("userCta")}
        </Button>
      }
    >
      {isAdmin ? t("adminBody") : t("userBody")}
    </Alert>
  );
}
