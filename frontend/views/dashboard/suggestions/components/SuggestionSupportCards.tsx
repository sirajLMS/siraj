"use client";

import { AutoAwesomeOutlined, SecurityOutlined, UpdateOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui";
import type { SuggestionSupportCardsProps } from "../types/suggestionsView.types";

const SUPPORT_CARDS = [
  { key: "privacy", icon: SecurityOutlined },
  { key: "fastResponse", icon: UpdateOutlined },
  { key: "constantEvolution", icon: AutoAwesomeOutlined },
] as const;

export function SuggestionSupportCards({ labels, variant }: Readonly<SuggestionSupportCardsProps>) {
  const isMobile = variant === "mobile";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 2,
        mt: isMobile ? 2 : 4,
      }}
    >
      {SUPPORT_CARDS.map(card => {
        const cardLabels = labels.support[card.key];
        const Icon = card.icon;

        if (isMobile) {
          return (
            <BaseCard key={card.key} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
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
            </BaseCard>
          );
        }

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
