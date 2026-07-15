"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";
import { formatPhoneDisplay, maskPhone } from "@/shared/lib/phone";

export type PhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({
  phone,
  masked = false,
  defaultRegion,
  fallback,
  typographyVariant,
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
