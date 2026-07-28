"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { fromGraphqlIanaTimezone, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";

interface Props {
  readonly labels: RescheduleFormLabels;
  readonly timezone: string;
}

function formatTimezoneLabel(timezone: string, locale: string): string {
  const normalized = timezone.includes("/") ? timezone : fromGraphqlIanaTimezone(timezone);
  return getTimezoneSelectLabel(normalized, locale);
}

export function TimezoneWarningBannerMobile({ labels, timezone }: Readonly<Props>) {
  const locale = useAppLocale();
  const timezoneLabel = formatTimezoneLabel(timezone, locale);

  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        p: 2,
        backgroundColor: theme.palette.warningContainer,
        borderLeft: 4,
        borderColor: theme.palette.onWarningContainer,
        borderRadius: 1,
      })}
    >
      <InfoOutlined sx={theme => ({ color: theme.palette.onWarningContainer })} />
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onWarningContainer })}>
        {labels.warning.message(timezoneLabel)}
      </Typography>
    </Box>
  );
}
