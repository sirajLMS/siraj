"use client";

import { Box, Typography } from "@mui/material";
import type { SuggestionHeroBannerProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionHeroBannerDesktop({ labels }: Readonly<Omit<SuggestionHeroBannerProps, "variant">>) {
  return (
    <Box
      sx={theme => ({
        position: "relative",
        overflow: "hidden",
        borderRadius: theme.layout.radius.card,
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.onPrimaryContainer,
        p: 6,
        mb: 4,
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
        <Typography variant="display" sx={{ mb: 2 }}>
          {labels.heroTitle}
        </Typography>
        <Typography variant="bodyLg" sx={{ opacity: 0.8, lineHeight: 1.6 }}>
          {labels.heroSubtitle}
        </Typography>
      </Box>
    </Box>
  );
}
