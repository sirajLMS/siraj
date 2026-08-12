"use client";

import { HistoryOutlined, ReceiptLongOutlined, SecurityOutlined } from "@mui/icons-material";
import { Box, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ComponentType, ReactNode } from "react";
import type { ManualInvoiceSupportCardsProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceSupportCards.types";

const SUPPORT_CARDS = [
  { key: "secureBilling", icon: SecurityOutlined },
  { key: "automatedLedgers", icon: ReceiptLongOutlined },
  { key: "draftMode", icon: HistoryOutlined },
] as const;

const StyledSupportBody = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export interface ManualInvoiceSupportCardsSharedConfig {
  readonly Card: ComponentType<{ readonly children: ReactNode }>;
}

export function ManualInvoiceSupportCardsShared({
  labels,
  config: { Card },
}: Readonly<ManualInvoiceSupportCardsProps & { readonly config: ManualInvoiceSupportCardsSharedConfig }>) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 3, mt: 4 }}>
      {SUPPORT_CARDS.map(card => {
        const cardLabels = labels.support[card.key];
        const Icon = card.icon;

        return (
          <Card key={card.key}>
            <Icon sx={{ color: theme.palette.primary.main, mb: 1.5 }} />
            <Typography variant="titleLg" sx={{ mb: 1 }}>
              {cardLabels.title}
            </Typography>
            <StyledSupportBody variant="bodyMd">{cardLabels.body}</StyledSupportBody>
          </Card>
        );
      })}
    </Box>
  );
}
