"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import { useLocale } from "next-intl";
import type * as React from "react";
import { fromGraphqlIanaTimezone, getTimezoneDisplayName } from "@/frontend/lib/timezone";

export type TimezoneDisplayProps = {
  readonly timezone?: string | null;
  readonly showId?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const TimezoneDisplay: React.FC<TimezoneDisplayProps> = ({
  timezone,
  showId = true,
  fallback,
  typographyVariant,
  sx,
}): React.ReactNode => {
  const locale = useLocale();

  if (!timezone) {
    return fallback ?? null;
  }

  const normalizedTimezone = timezone.includes("/") ? timezone : fromGraphqlIanaTimezone(timezone);
  const label = getTimezoneDisplayName(normalizedTimezone, locale);
  const display = showId ? label : label.replace(` (${normalizedTimezone})`, "");

  return (
    <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap", ...sx }}>
      {display}
    </Typography>
  );
};
