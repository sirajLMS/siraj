"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { fromGraphqlIanaTimezone, getTimezonePathLabel, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

export type DesktopTimezoneDisplayProps = {
  readonly timezone?: string | null;
  readonly showOffset?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const DesktopTimezoneDisplay: React.FC<DesktopTimezoneDisplayProps> = ({
  timezone,
  showOffset = true,
  fallback,
  typographyVariant = "bodyMd",
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
    <Typography component="span" variant={typographyVariant} sx={{ whiteSpace: "nowrap", ...sx }}>
      {display}
    </Typography>
  );
};
