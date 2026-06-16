"use client";

import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Alert, Box, IconButton, Typography } from "@mui/material";

interface TimezoneWarningBannerProps {
  readonly studentTimezone: string;
  readonly onDismiss: () => void;
  readonly labels: {
    readonly title: string;
    readonly description: string;
  };
}

export function TimezoneWarningBanner({ studentTimezone, onDismiss, labels }: TimezoneWarningBannerProps) {
  return (
    <Alert
      icon={<WarningAmberIcon />}
      severity="error"
      sx={theme => ({
        mb: 3,
        borderRadius: 2,
        borderLeft: 4,
        borderColor: theme.palette.status.cancelled,
        bgcolor: theme.palette.errorContainer,
        color: theme.palette.onErrorContainer,
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.85 },
        },
        "& .MuiAlert-icon": {
          color: theme.palette.error.main,
        },
      })}
      action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={onDismiss}
          sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
          {labels.title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {labels.description.replace("{timezone}", studentTimezone)}
        </Typography>
      </Box>
    </Alert>
  );
}
