"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { fromGraphqlIanaTimezone, getTimezonePathLabel, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

export type MobileTimezoneDisplayProps = {
  readonly timezone?: string | null;
  readonly showOffset?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

/**
 * Mobile-tier timezone display. Self-contained — no shared base.
 *
 * Differences vs desktop:
 * - Default `typographyVariant="caption"` (vs desktop `"bodyMd"`) for compact
 *   mobile typography.
 * - `whiteSpace: "nowrap"` preserved to keep timezone label on a single line.
 */
export const MobileTimezoneDisplay: React.FC<MobileTimezoneDisplayProps> = ({
  timezone,
  showOffset = true,
  fallback,
  typographyVariant = "caption",
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
