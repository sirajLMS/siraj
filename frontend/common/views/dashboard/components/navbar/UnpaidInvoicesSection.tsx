"use client";

import { useQuery } from "@apollo/client/react";
import { PaymentsOutlined } from "@mui/icons-material";
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { unpaidInvoicesAlertQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/billing-alerts.documents";
import { buildFxDisplayMessages, type FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useRouter } from "@/shared/i18n/navigation";
import type { ErrorsLabels } from "@/shared/locale";
import { useAppTranslation, type ProfileLabels} from "@/shared/locale";

function buildUnpaidInvoicesFxMessages(
  tProfile: Pick<ProfileLabels, "convertedAmount" | "convertedTotalApprox">,
  tErrors: ErrorsLabels
): FxDisplayMessages {
  return buildFxDisplayMessages(
    {
      convertedAmount: tProfile.convertedAmount,
    },
    tErrors,
    {
      convertedTotalApprox: tProfile.convertedTotalApprox,
    }
  );
}

function LoadingState({ message }: { readonly message: string }) {
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
        {message}
      </Typography>
    </Box>
  );
}

function ErrorState({ message }: { readonly message: string }) {
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="body2" sx={theme => ({ color: theme.palette.error.main })}>
        {message}
      </Typography>
    </Box>
  );
}

function EmptyState({ message }: { readonly message: string }) {
  return (
    <Box sx={{ px: 2, py: 1.5, textAlign: "center" }}>
      <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
        {message}
      </Typography>
    </Box>
  );
}

function SectionHeader({
  title,
  count,
  totalLabel,
  totalLabelValue,
}: {
  readonly title: string;
  readonly count: number;
  readonly totalLabel: string;
  readonly totalLabelValue: string;
}) {
  return (
    <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      <PaymentsOutlined fontSize="small" />
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {title}
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
        {count}
      </Typography>
      <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, ml: "auto" })}>
        {totalLabel}: {totalLabelValue}
      </Typography>
    </Box>
  );
}

function FxNoteSection({
  hasDisplayCurrency,
  withDisplayCurrencyNote,
  withoutDisplayCurrencyNote,
}: {
  readonly hasDisplayCurrency: boolean;
  readonly withDisplayCurrencyNote: string;
  readonly withoutDisplayCurrencyNote: string;
}) {
  if (hasDisplayCurrency) {
    return (
      <Typography
        variant="caption"
        sx={theme => ({ display: "block", px: 2, pb: 0.5, color: theme.palette.text.secondary })}
      >
        {withDisplayCurrencyNote}
      </Typography>
    );
  }
  return (
    <Typography
      variant="caption"
      sx={theme => ({ display: "block", px: 2, pb: 0.5, color: theme.palette.text.secondary, fontStyle: "italic" })}
    >
      ({withoutDisplayCurrencyNote})
    </Typography>
  );
}

interface InvoiceItemRowProps {
  readonly item: {
    readonly id: string | null;
    readonly userId?: string | null;
    readonly userName?: string | null;
    readonly overdueCount?: number | null;
    readonly amountsByCurrency: Parameters<typeof mapBillingCurrencyBuckets>[0];
  };
  readonly fxMessages: FxDisplayMessages;
  readonly onUserClick: (userId: string) => void;
}

function InvoiceItemRow({ item, fxMessages, onUserClick }: InvoiceItemRowProps) {
  const amountLabel = formatBillingCurrencyTotals(
    mapBillingCurrencyBuckets(item.amountsByCurrency),
    "en",
    fxMessages
  ).primary;

  const itemText = (
    <ListItemText
      primary={item.userName ?? ""}
      secondary={`${amountLabel} — ${item.overdueCount ?? 0} overdue`}
      slotProps={{
        primary: { variant: "body2", sx: { fontWeight: 500 } },
        secondary: { variant: "caption" },
      }}
    />
  );

  return (
    <ListItem key={item.id ?? undefined} disablePadding>
      <RequirePermission
        permissions={AppPermission.UserViewProfile}
        fallback={<Box sx={{ px: 2, py: 0.75, width: "100%" }}>{itemText}</Box>}
      >
        <ListItemButton onClick={() => item.userId && onUserClick(item.userId)} sx={{ py: 0.75 }}>
          {itemText}
        </ListItemButton>
      </RequirePermission>
    </ListItem>
  );
}

export function UnpaidInvoicesSection() {
  const t = useAppTranslation().dashboardTranslations.coreNotifications;
  const tProfile = useAppTranslation().profileTranslations.base;
  const tErrors = useAppTranslation().errorsTranslations;
  const router = useRouter();
  const displayCurrency = useUserStore(state => state.displayCurrency);

  const { data, loading, error } = useQuery(unpaidInvoicesAlertQueryDocument);

  if (loading) {
    return <LoadingState message={t.loadingBilling} />;
  }

  if (error) {
    return <ErrorState message={t.errorLoading} />;
  }

  const summary = data?.unpaidInvoicesAlert;

  if (!summary || summary.totalOverdueInvoices === 0) {
    return <EmptyState message={t.noUnpaidInvoices} />;
  }

  const fxMessages = buildUnpaidInvoicesFxMessages(tProfile, tErrors);

  const globalTotalLabel = formatBillingCurrencyTotals(
    mapBillingCurrencyBuckets(summary.overdueAmountsByCurrency),
    "en",
    fxMessages
  ).primary;

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}/billing-profile`);
  };

  return (
    <Box>
      <SectionHeader
        title={t.unpaidInvoicesTitle}
        count={summary.totalOverdueInvoices ?? 0}
        totalLabel={t.totalOverdueLabel}
        totalLabelValue={globalTotalLabel}
      />
      <FxNoteSection
        hasDisplayCurrency={Boolean(displayCurrency)}
        withDisplayCurrencyNote={t.unpaidInvoicesFxNote}
        withoutDisplayCurrencyNote={t.noDisplayCurrencyNote}
      />
      <List disablePadding dense>
        {(summary.items ?? []).map(item => (
          <InvoiceItemRow
            key={item.id ?? undefined}
            item={item}
            fxMessages={fxMessages}
            onUserClick={handleUserClick}
          />
        ))}
      </List>
    </Box>
  );
}
