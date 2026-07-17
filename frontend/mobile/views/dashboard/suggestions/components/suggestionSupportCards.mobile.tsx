"use client";

import { AutoAwesomeOutlined, SecurityOutlined, UpdateOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { SuggestionSupportCardsProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui";

const SUPPORT_CARDS = [
  { key: "privacy", icon: SecurityOutlined },
  { key: "fastResponse", icon: UpdateOutlined },
  { key: "constantEvolution", icon: AutoAwesomeOutlined },
] as const;

export function SuggestionSupportCardsMobile({ labels }: Readonly<Omit<SuggestionSupportCardsProps, "variant">>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 2,
      }}
    >
      {SUPPORT_CARDS.map(card => {
        const cardLabels = labels.support[card.key];
        const Icon = card.icon;

        return (
          <MobileBaseCard key={card.key} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Box
              sx={theme => ({
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `1px solid ${theme.palette.primary.main}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              })}
            >
              <Icon sx={theme => ({ color: theme.palette.primary.main })} />
            </Box>
            <Box>
              <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
                {cardLabels.title}
              </Typography>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {cardLabels.body}
              </Typography>
            </Box>
          </MobileBaseCard>
        );
      })}
    </Box>
  );
}
