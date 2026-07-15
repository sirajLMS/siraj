"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { fromGraphqlIanaTimezone, getTimezonePathLabel, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";

export type TimezoneDisplayProps = {
  readonly timezone?: string | null;
  readonly showOffset?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const TimezoneDisplay: React.FC<TimezoneDisplayProps> = ({
  timezone,
  showOffset = true,
  fallback,
  typographyVariant,
  sx,
}): React.ReactNode => {
  const locale = useAppLocale();

  if (!timezone) {
    return fallback ?? null;
  }

  const normalizedTimezone = timezone.includes("/") ? timezone : fromGraphqlIanaTimezone(timezone);
  const display = showOffset
    ? getTimezoneSelectLabel(normalizedTimezone, locale)
    : getTimezonePathLabel(normalizedTimezone, locale);

  return (
    <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap", ...sx }}>
      {display}
    </Typography>
  );
};
