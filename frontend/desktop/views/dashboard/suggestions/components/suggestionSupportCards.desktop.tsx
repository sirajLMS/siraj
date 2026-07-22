"use client";

import { AutoAwesomeOutlined, SecurityOutlined, UpdateOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type { SuggestionSupportCardsProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

const SUPPORT_CARDS = [
  { key: "privacy", icon: SecurityOutlined },
  { key: "fastResponse", icon: UpdateOutlined },
  { key: "constantEvolution", icon: AutoAwesomeOutlined },
] as const;

export function SuggestionSupportCardsDesktop({ labels }: Readonly<Omit<SuggestionSupportCardsProps, "variant">>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 2,
        mt: 4,
      }}
    >
      {SUPPORT_CARDS.map(card => {
        const cardLabels = labels.support[card.key];
        const Icon = card.icon;

        return (
          <BaseCard key={card.key} sx={{ flex: 1, textAlign: "center" }}>
            <Box
              sx={theme => ({
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: theme.palette.action.selected,
                color: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              })}
            >
              <Icon />
            </Box>
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
