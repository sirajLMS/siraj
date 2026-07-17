"use client";

import { Box, Typography } from "@mui/material";
import type { SuggestionHeroBannerProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionHeroBannerMobile({ labels }: Readonly<Omit<SuggestionHeroBannerProps, "variant">>) {
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
