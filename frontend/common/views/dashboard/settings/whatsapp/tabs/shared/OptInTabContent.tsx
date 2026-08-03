"use client";

import { Box, CircularProgress, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

/** Shared inner content for OptInTab — used by both desktop and mobile wrappers. */
export function OptInTabContent({ labels, isOptedIn, optInLoading, onToggleOptIn }: Readonly<OptInTabSharedProps>) {
  const t = labels.page;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="titleLg">{t.optInTitle}</Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
          {t.optInSubtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          border: theme => `1px solid ${theme.palette.outlineVariant}`,
        }}
      >
        {optInLoading ? (
          <CircularProgress size={24} />
        ) : (
          <FormControlLabel
            control={<Switch checked={isOptedIn} onChange={e => onToggleOptIn(e.target.checked)} />}
            label={t.optInToggle}
            sx={{ gap: 1.5 }}
          />
        )}
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 1, display: "block" }}>
          {t.optInConsentBody}
        </Typography>
        <Typography
          variant="labelMd"
          sx={{
            mt: 1,
            display: "block",
            color: theme => (isOptedIn ? theme.palette.success.main : theme.palette.text.secondary),
          }}
        >
          {isOptedIn ? t.optInEnabled : t.optInDisabled}
        </Typography>
      </Box>
    </Stack>
  );
}
