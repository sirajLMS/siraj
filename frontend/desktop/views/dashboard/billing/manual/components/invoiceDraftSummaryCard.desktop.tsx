"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BillingManualLabels } from "@/shared/locale";

interface InvoiceDraftSummaryCardDesktopProps {
  readonly labels: BillingManualLabels;
  readonly totalFormatted: string;
  readonly currency: CurrencyCode;
}

const StyledDesktopSummaryContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.surfaceContainerLowest,
  borderRadius: theme.layout.radius.card,
  border: `1px dashed ${theme.palette.outlineVariant}`,
  padding: theme.spacing(3),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
}));

const StyledInfoIconCircle = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  backgroundColor: theme.palette.action.selected,
  color: theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledSummaryTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledSummarySubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledTotalLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

const StyledTotalValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
}));

export function InvoiceDraftSummaryCardDesktop({
  labels,
  totalFormatted,
  currency,
}: Readonly<InvoiceDraftSummaryCardDesktopProps>) {
  return (
    <StyledDesktopSummaryContainer sx={{ gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <StyledInfoIconCircle>
          <InfoOutlined />
        </StyledInfoIconCircle>
        <Box>
          <StyledSummaryTitle variant="titleLg">{labels.summaryTitle}</StyledSummaryTitle>
          <StyledSummarySubtitle variant="bodyMd">{labels.summarySubtitle}</StyledSummarySubtitle>
        </Box>
      </Box>
      <Box sx={{ textAlign: "end" }}>
        <StyledTotalLabel variant="labelMd">{labels.totalDraftValue}</StyledTotalLabel>
        <StyledTotalValue variant="headlineMd">
          {currency} {totalFormatted}
        </StyledTotalValue>
      </Box>
    </StyledDesktopSummaryContainer>
  );
}
