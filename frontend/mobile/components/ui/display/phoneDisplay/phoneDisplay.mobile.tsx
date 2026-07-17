"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { formatPhoneDisplay, maskPhone } from "@/shared/lib/phone";

export type MobilePhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

/**
 * Mobile-tier phone display. Self-contained — no shared base.
 *
 * Differences vs desktop:
 * - Default `typographyVariant="caption"` (vs desktop `"bodyMd"`) for compact
 *   mobile typography.
 * - Preserves `dir="ltr"` and `whiteSpace: "nowrap"` for safe phone rendering.
 */
export const MobilePhoneDisplay: React.FC<MobilePhoneDisplayProps> = ({
  phone,
  masked = false,
  defaultRegion,
  fallback,
  typographyVariant = "caption",
  sx,
}): React.ReactNode => {
  const locale = useAppLocale();

  if (!phone) {
    return fallback ?? null;
  }

  const display = masked ? maskPhone(phone, defaultRegion) : formatPhoneDisplay(phone, locale);

  return (
    <Typography variant={typographyVariant} dir="ltr" sx={{ whiteSpace: "nowrap", ...sx }}>
      {display}
    </Typography>
  );
};
