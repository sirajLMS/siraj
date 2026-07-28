"use client";

import { NotificationsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useAppTranslation } from "@/shared/locale";

export function NotificationDrawerEmptyState() {
  const emptyMessage = useAppTranslation().notificationsTranslations.noNotifications;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 2,
        textAlign: "center",
      }}
    >
      <NotificationsOutlined sx={theme => ({ fontSize: 48, color: theme.palette.onSurfaceVariant, opacity: 0.5 })} />
      <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary, mt: 1.5 })}>
        {emptyMessage}
      </Typography>
    </Box>
  );
}
