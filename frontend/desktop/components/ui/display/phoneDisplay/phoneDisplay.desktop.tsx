"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { formatPhoneDisplay, maskPhone } from "@/shared/lib/phone";

export type DesktopPhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};

export const DesktopPhoneDisplay = ({
  phone,
  masked = false,
  defaultRegion,
  fallback,
  typographyVariant = "bodyMd",
  sx,
}: DesktopPhoneDisplayProps): React.JSX.Element | null => {
  const locale = useAppLocale();
  const fallbackNode =
    fallback == null ? null : typeof fallback === "string" || typeof fallback === "number" ? (
      <Typography variant={typographyVariant} dir="ltr" sx={{ whiteSpace: "nowrap", ...sx }}>
        {fallback}
      </Typography>
    ) : (
      <>{fallback}</>
    );

  if (!phone) {
    return fallbackNode;
  }

  const display = masked ? maskPhone(phone, defaultRegion) : formatPhoneDisplay(phone, locale);

  return (
    <Typography variant={typographyVariant} dir="ltr" sx={{ whiteSpace: "nowrap", ...sx }}>
      {display}
    </Typography>
  );
};
