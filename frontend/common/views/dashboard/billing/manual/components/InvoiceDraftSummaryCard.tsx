"use client";

import { InfoOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

interface InvoiceDraftSummaryCardProps {
  readonly labels: BillingManualLabels;
  readonly totalFormatted: string;
  readonly currency: CurrencyCode;
  readonly variant: "desktop" | "mobile";
}

// Mobile summary container with primary container background and space-between layout
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

// Circular border container for the receipt icon on mobile
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

// Desktop summary container with surface background and dashed border
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

// Circular icon container for the info icon on desktop with selected action background
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

// Summary title styled with primary color
const StyledSummaryTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Summary subtitle styled with secondary text color
const StyledSummarySubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Total label with uppercase transformation and surface variant color
const StyledTotalLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

// Total value styled with primary color and bold weight for emphasis
const StyledTotalValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
}));

export function InvoiceDraftSummaryCard({
  labels,
  totalFormatted,
  currency,
  variant,
}: Readonly<InvoiceDraftSummaryCardProps>) {
  const isMobile = variant === "mobile";

  if (isMobile) {
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
