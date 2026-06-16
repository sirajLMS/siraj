"use client";

import { HistoryOutlined, ReceiptLongOutlined, SecurityOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui";
import type { BillingManualLabels } from "@/frontend/messages/types/dashboard/billing/manual";

interface ManualInvoiceSupportCardsProps {
  readonly labels: BillingManualLabels;
}

const SUPPORT_CARDS = [
  { key: "secureBilling", icon: SecurityOutlined },
  { key: "automatedLedgers", icon: ReceiptLongOutlined },
  { key: "draftMode", icon: HistoryOutlined },
] as const;

export function ManualInvoiceSupportCards({ labels }: Readonly<ManualInvoiceSupportCardsProps>) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        gap: 3,
        mt: 4,
      }}
    >
      {SUPPORT_CARDS.map(card => {
        const cardLabels = labels.support[card.key];
        const Icon = card.icon;

        return (
          <BaseCard key={card.key}>
            <Icon sx={theme => ({ color: theme.palette.primary.main, mb: 1.5 })} />
            <Typography variant="titleLg" sx={{ mb: 1 }}>
              {cardLabels.title}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {cardLabels.body}
            </Typography>
          </BaseCard>
        );
      })}
    </Box>
  );
}
