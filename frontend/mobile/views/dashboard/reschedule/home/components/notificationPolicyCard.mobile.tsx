"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";

interface Props {
  readonly labels: RescheduleFormLabels;
}

export function NotificationPolicyCardMobile({ labels }: Readonly<Props>) {
  const notificationPolicy = labels.notificationPolicy;

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
          {notificationPolicy.title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {notificationPolicy.description}
        </Typography>
      </Box>
    </Box>
  );
}
