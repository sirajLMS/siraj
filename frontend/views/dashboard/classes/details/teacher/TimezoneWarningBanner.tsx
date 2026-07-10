"use client";

import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Alert, Box, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { TimezoneDisplay } from "@/frontend/components/ui/display";
import { edgeToEdgeSx } from "@/frontend/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/utils/sx/mergeSx";
import { classDetailsContentPaddingSx } from "@/frontend/views/dashboard/classes/details/classDetailsMobileLayout";

interface TimezoneWarningBannerProps {
  readonly studentTimezone: string;
  readonly onDismiss: () => void;
  readonly labels: {
    readonly title: string;
    readonly prefix: string;
    readonly suffix: string;
  };
}

// Error-container-tinted alert with pulsing animation and canceled-border accent
const StyledTimezoneWarningAlert = styled(Alert)(({ theme }) => ({
  borderLeft: 4,
  borderColor: theme.palette.status.cancelled,
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.onErrorContainer,
  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "@keyframes pulse": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.85 },
  },
  "& .MuiAlert-icon": {
    color: theme.palette.error.main,
  },
}));

export function TimezoneWarningBanner({ studentTimezone, onDismiss, labels }: TimezoneWarningBannerProps) {
  return (
    <StyledTimezoneWarningAlert
      icon={<WarningAmberIcon />}
      severity="error"
      sx={mergeSx({ mb: { xs: 0, lg: 3 } }, edgeToEdgeSx, classDetailsContentPaddingSx)}
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
          {labels.prefix}
          <TimezoneDisplay timezone={studentTimezone} sx={{ opacity: 0.9 }} />
          {labels.suffix}
        </Typography>
      </Box>
    </StyledTimezoneWarningAlert>
  );
}
