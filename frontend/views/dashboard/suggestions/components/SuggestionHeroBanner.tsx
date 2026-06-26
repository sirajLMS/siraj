"use client";

import { Box, Typography } from "@mui/material";
import type { SuggestionsParentLabels } from "@/shared/messages/types/dashboard/suggestions/main";

interface SuggestionHeroBannerProps {
  readonly labels: SuggestionsParentLabels;
  readonly variant: "desktop" | "mobile";
}

export function SuggestionHeroBanner({ labels, variant }: Readonly<SuggestionHeroBannerProps>) {
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
          p: 3,
          mb: 2,
        })}
      >
        <Typography variant="headlineMd" sx={{ mb: 1 }}>
          {labels.heroTitle}
        </Typography>
        <Typography variant="bodyMd" sx={{ opacity: 0.8, maxWidth: 320 }}>
          {labels.heroSubtitle}
        </Typography>
      </Box>
    );
  }

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
