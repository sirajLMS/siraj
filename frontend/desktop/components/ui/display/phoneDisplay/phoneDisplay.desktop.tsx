"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { formatPhoneDisplay, maskPhone } from "@/shared/lib/phone";

export type DesktopPhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const DesktopPhoneDisplay: React.FC<DesktopPhoneDisplayProps> = ({
  phone,
  masked = false,
  defaultRegion,
  fallback,
  typographyVariant = "bodyMd",
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
