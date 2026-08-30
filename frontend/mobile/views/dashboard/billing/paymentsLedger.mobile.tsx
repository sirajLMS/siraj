"use client";

import { CreditCardOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { PaymentsLedgerViewModel } from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

const MISSING_VALUE = "—";

export function PaymentsLedgerMobileView({
  rows,
  loading,
  balancesLoading,
  showError,
  metrics,
  paginationOptions,
  labels,
  onMetricClick,
}: Readonly<PaymentsLedgerViewModel>): ReactNode {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {showError ? <Alert severity="error">{labels.loadError}</Alert> : null}
      {metrics.length > 0 || balancesLoading ? (
        <MobileMetricCardGrid
          metrics={metrics}
          loading={balancesLoading && metrics.length === 0}
          onMetricClick={onMetricClick}
          stretchCells
        />
      ) : null}
      <MobileSectionPanel title={labels.historySectionTitle} contentInset={false}>
        <MobileCardList
          rows={rows}
          loading={loading}
          getKey={row => row.id}
          emptyMessage={`${labels.emptyTitle}. ${labels.emptySubtitle}`}
          layout="edge-to-edge"
          paginationOptions={paginationOptions}
          renderItem={row => (
            <MobileCardListItem variant="edge-to-edge">
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography variant="titleLg" sx={{ fontWeight: 700, minWidth: 0 }}>
                  {row.studentName ?? MISSING_VALUE}
                </Typography>
                {row.creditHours != null || row.creditsPurchased > 0 ? (
                  <Chip size="small" variant="outlined" color="primary" label={row.creditsLabel} />
                ) : null}
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mt: 1 }}>
                <Typography variant="bodyMd" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {row.amountLabel}
                </Typography>
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {row.packageName ?? MISSING_VALUE}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CreditCardOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
                  <Typography variant="labelMd">{row.methodLabel}</Typography>
                </Box>
                <Typography
                  variant="labelMd"
                  sx={theme => ({ color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" })}
                >
                  {row.dateLabel}
                </Typography>
              </Box>
            </MobileCardListItem>
          )}
        />
      </MobileSectionPanel>
    </MobilePageContainer>
  );
}
