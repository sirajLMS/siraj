"use client";

import { useQuery } from "@apollo/client/react";
import { PaymentsOutlined } from "@mui/icons-material";
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { unpaidInvoicesAlertQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/billing-alerts.documents";
import { formatBillingCurrencyTotals, mapBillingCurrencyBuckets } from "@/frontend/lib/formatBillingCurrencyTotals";
import { useRouter } from "@/shared/i18n/routing";

export function UnpaidInvoicesSection() {
  const t = useTranslations("dashboard.notifications");
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const { data, loading } = useQuery(unpaidInvoicesAlertQueryDocument);

  if (loading) {
    return (
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t("loadingBilling")}
        </Typography>
      </Box>
    );
  }

  const summary = data?.unpaidInvoicesAlert;

  if (!summary || summary.totalOverdueInvoices === 0) {
    return (
      <Box sx={{ px: 2, py: 1.5, textAlign: "center" }}>
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t("noUnpaidInvoices")}
        </Typography>
      </Box>
    );
  }

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}/billing-profile`);
  };

  const items = summary.items ?? [];
  const fxMessages = {
    convertedAmount: (values: {
      lockedAmount: string;
      lockedCurrency: string;
      convertedApprox: string;
      displayCurrency: string;
    }) => tProfile("convertedAmount", values),
    convertedTotalApprox: (values: { convertedApprox: string; displayCurrency: string }) =>
      tProfile("convertedTotalApprox", values),
    displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) =>
      tErrors("displayCurrencyFallback", values),
  };

  const globalTotalLabel = formatBillingCurrencyTotals(
    mapBillingCurrencyBuckets(summary.overdueAmountsByCurrency),
    locale,
    fxMessages
  ).primary;

  return (
    <Box>
      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <PaymentsOutlined fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t("unpaidInvoicesTitle")}
        </Typography>
        <Typography
          variant="caption"
          sx={theme => ({
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            fontWeight: 600,
          })}
        >
          {summary.totalOverdueInvoices}
        </Typography>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, ml: "auto" })}>
          {t("totalOverdueLabel")}: {globalTotalLabel}
        </Typography>
      </Box>

      <List disablePadding dense>
        {items.map(item => {
          const amountLabel = formatBillingCurrencyTotals(
            mapBillingCurrencyBuckets(item.amountsByCurrency),
            locale,
            fxMessages
          ).primary;

          const itemText = (
            <ListItemText
              primary={item.userName}
              secondary={`${amountLabel} — ${item.overdueCount} overdue`}
              slotProps={{
                primary: { variant: "body2", sx: { fontWeight: 500 } },
                secondary: { variant: "caption" },
              }}
            />
          );

          return (
            <ListItem key={item.id} disablePadding>
              <RequirePermission
                permissions={AppPermission.UserViewProfile}
                fallback={<Box sx={{ px: 2, py: 0.75, width: "100%" }}>{itemText}</Box>}
              >
                <ListItemButton onClick={() => item.userId && handleUserClick(item.userId)} sx={{ py: 0.75 }}>
                  {itemText}
                </ListItemButton>
              </RequirePermission>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
