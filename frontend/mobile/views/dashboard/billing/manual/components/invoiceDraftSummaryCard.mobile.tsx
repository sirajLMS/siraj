"use client";

import { ReceiptLongOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BillingManualLabels } from "@/shared/locale";

interface InvoiceDraftSummaryCardMobileProps {
  readonly labels: BillingManualLabels;
  readonly totalFormatted: string;
  readonly currency: CurrencyCode;
}

const StyledMobileSummaryContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  borderRadius: theme.layout.radius.card,
  padding: theme.layout.cardPadding,
  boxShadow: theme.palette.shadow.card,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const StyledMobileIconCircle = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: `1px solid ${theme.palette.onPrimaryContainer}`,
  opacity: 0.2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export function InvoiceDraftSummaryCardMobile({
  labels,
  totalFormatted,
  currency,
}: Readonly<InvoiceDraftSummaryCardMobileProps>) {
  return (
    <StyledMobileSummaryContainer>
      <Box>
        <Typography variant="labelMd" sx={{ opacity: 0.8, textTransform: "uppercase" }}>
          {labels.totalDraftValue}
        </Typography>
        <Typography variant="headlineMd">
          {currency} {totalFormatted}
        </Typography>
      </Box>
      <StyledMobileIconCircle>
        <ReceiptLongOutlined />
      </StyledMobileIconCircle>
    </StyledMobileSummaryContainer>
  );
}
