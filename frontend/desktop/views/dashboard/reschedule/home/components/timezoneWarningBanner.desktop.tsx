"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { fromGraphqlIanaTimezone, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly timezone: string;
}

function formatTimezoneLabel(timezone: string, locale: string): string {
  const normalized = timezone.includes("/") ? timezone : fromGraphqlIanaTimezone(timezone);
  return getTimezoneSelectLabel(normalized, locale);
}

export function TimezoneWarningBannerDesktop({ timezone }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.rescheduleForm;
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
        {t.warning.message(timezoneLabel)}
      </Typography>
    </Box>
  );
}
