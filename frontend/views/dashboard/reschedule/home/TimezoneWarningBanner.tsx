"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

interface Props {
  readonly timezone: string;
}

export function TimezoneWarningBanner({ timezone }: Readonly<Props>) {
  const t = useTranslations("dashboard.rescheduleForm.warning");

  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        p: 2,
        bgcolor: theme.palette.warningContainer,
        borderLeft: 4,
        borderColor: theme.palette.onWarningContainer,
        borderRadius: 1,
      })}
    >
      <InfoOutlined sx={theme => ({ color: theme.palette.onWarningContainer })} />
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onWarningContainer })}>
        {t("description", { timezone })}
      </Typography>
    </Box>
  );
}
