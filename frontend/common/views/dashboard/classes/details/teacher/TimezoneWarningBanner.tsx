"use client";

import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Alert, Box, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { fromGraphqlIanaTimezone, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { edgeToEdgeSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";

interface TimezoneWarningBannerProps {
  readonly studentTimezone: string;
  readonly teacherTimezone: string;
  readonly onDismiss: () => void;
  readonly labels: {
    readonly title: string;
    readonly message: (studentTimezone: string, teacherTimezone: string) => string;
  };
}

// Warning-container-tinted alert with pulsing animation
const StyledTimezoneWarningAlert = styled(Alert)(({ theme }) => ({
  borderLeft: 4,
  borderColor: theme.palette.onWarningContainer,
  backgroundColor: theme.palette.warningContainer,
  color: theme.palette.onWarningContainer,
  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "@keyframes pulse": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.85 },
  },
  "& .MuiAlert-icon": {
    color: theme.palette.onWarningContainer,
  },
}));

function formatTimezoneLabel(timezone: string, locale: string): string {
  const normalized = timezone.includes("/") ? timezone : fromGraphqlIanaTimezone(timezone);
  return getTimezoneSelectLabel(normalized, locale);
}

export function TimezoneWarningBanner({
  studentTimezone,
  teacherTimezone,
  onDismiss,
  labels,
}: TimezoneWarningBannerProps) {
  const locale = useAppLocale();
  const studentLabel = formatTimezoneLabel(studentTimezone, locale);
  const teacherLabel = formatTimezoneLabel(teacherTimezone, locale);

  return (
    <StyledTimezoneWarningAlert
      icon={<WarningAmberIcon />}
      severity="warning"
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
          {labels.message(studentLabel, teacherLabel)}
        </Typography>
      </Box>
    </StyledTimezoneWarningAlert>
  );
}
