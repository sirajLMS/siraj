"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useAppTranslation } from "@/shared/locale/client";

export function NotificationPolicyCard() {
  const t = useAppTranslation("dashboard.rescheduleForm").notificationPolicy;

  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 3,
        backgroundColor: theme.palette.surfaceContainerLow,
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
      })}
    >
      <InfoOutlined sx={theme => ({ color: theme.palette.secondary.main })} />
      <Box>
        <Typography variant="labelMd" sx={theme => ({ fontWeight: 700, color: theme.palette.secondary.main, mb: 0.5 })}>
          {t.title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.description}
        </Typography>
      </Box>
    </Box>
  );
}
