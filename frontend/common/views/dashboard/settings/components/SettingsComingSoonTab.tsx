"use client";

import { Box, Typography } from "@mui/material";
import { Translation, useAppTranslation } from "@/shared/locale";

export function SettingsComingSoonTab() {
  const t = useAppTranslation(Translation.Dashboard.Settings);

  return (
    <Box sx={{ py: 4 }}>
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
        {t.comingSoon}
      </Typography>
    </Box>
  );
}
