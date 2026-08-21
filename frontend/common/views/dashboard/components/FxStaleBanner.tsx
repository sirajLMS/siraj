"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Button } from "@mui/material";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { fxSyncHealthQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { Link } from "@/shared/i18n";
import { usePathname } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

export function FxStaleBanner(): React.ReactNode {
  const pathname = usePathname();
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const hasPermission = useUserStore(state => state.hasPermission);
  const isAdmin = hasPermission(AppPermission.BillingViewExchangeRates);
  const t = useAppTranslation(Translation.Dashboard.Billing).fxStaleBanner;

  const { data } = useQuery(fxSyncHealthQueryDocument, {
    fetchPolicy: "cache-and-network",
    skip: !displayCurrency,
  });

  if (!displayCurrency) {
    return null;
  }

  if (pathname.includes("/billing/exchange-rates") || pathname.includes("/profile/edit")) {
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
        <Link href={isAdmin ? "/billing/exchange-rates" : "/profile/edit"} style={{ textDecoration: "none" }}>
          <Button color="inherit" size="small">
            {isAdmin ? t.adminCta : t.userCta}
          </Button>
        </Link>
      }
    >
      {isAdmin ? t.adminBody : t.userBody}
    </Alert>
  );
}
