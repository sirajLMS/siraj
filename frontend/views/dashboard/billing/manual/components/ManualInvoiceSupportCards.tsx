"use client";

import { HistoryOutlined, ReceiptLongOutlined, SecurityOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

interface ManualInvoiceSupportCardsProps {
  readonly labels: BillingManualLabels;
}

const SUPPORT_CARDS = [
  { key: "secureBilling", icon: SecurityOutlined },
  { key: "automatedLedgers", icon: ReceiptLongOutlined },
  { key: "draftMode", icon: HistoryOutlined },
] as const;

// Support card body text styled with secondary color for subdued appearance
const StyledSupportBody = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

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
            <Icon sx={{ color: theme => theme.palette.primary.main, mb: 1.5 }} />
            <Typography variant="titleLg" sx={{ mb: 1 }}>
              {cardLabels.title}
            </Typography>
            <StyledSupportBody variant="bodyMd">{cardLabels.body}</StyledSupportBody>
          </BaseCard>
        );
      })}
    </Box>
  );
}
