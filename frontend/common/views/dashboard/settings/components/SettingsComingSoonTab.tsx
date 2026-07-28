"use client";

import { Box, Typography } from "@mui/material";
import { useAppTranslation } from "@/shared/locale";

export function SettingsComingSoonTab() {
  const t = useAppTranslation().dashboardTranslations.settings;

  return (
    <Box sx={{ py: 4 }}>
      <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{t.comingSoon}</Typography>
    </Box>
  );
}
