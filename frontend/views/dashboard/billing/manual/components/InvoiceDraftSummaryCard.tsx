"use client";

import { InfoOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

interface InvoiceDraftSummaryCardProps {
  readonly labels: BillingManualLabels;
  readonly totalFormatted: string;
  readonly variant: "desktop" | "mobile";
}

export function InvoiceDraftSummaryCard({ labels, totalFormatted, variant }: Readonly<InvoiceDraftSummaryCardProps>) {
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <Box
        sx={theme => ({
          bgcolor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
          borderRadius: theme.layout.radius.card,
          p: theme.layout.cardPadding,
          boxShadow: theme.palette.shadow.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        })}
      >
        <Box>
          <Typography variant="labelMd" sx={{ opacity: 0.8, textTransform: "uppercase" }}>
            {labels.totalDraftValue}
          </Typography>
          <Typography variant="headlineMd">AED {totalFormatted}</Typography>
        </Box>
        <Box
          sx={theme => ({
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `1px solid ${theme.palette.onPrimaryContainer}`,
            opacity: 0.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <ReceiptLongOutlined />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.surfaceContainerLowest,
        borderRadius: theme.layout.radius.card,
        border: `1px dashed ${theme.palette.outlineVariant}`,
        p: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={theme => ({
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: theme.palette.action.selected,
            color: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <InfoOutlined />
        </Box>
        <Box>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {labels.summaryTitle}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.summarySubtitle}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: "end" }}>
        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textTransform: "uppercase" })}
        >
          {labels.totalDraftValue}
        </Typography>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          AED {totalFormatted}
        </Typography>
      </Box>
    </Box>
  );
}
