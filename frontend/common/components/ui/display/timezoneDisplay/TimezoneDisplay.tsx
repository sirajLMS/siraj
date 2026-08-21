"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { getTimezonePathLabel, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export type TimezoneDisplayProps = {
  readonly timezone?: IanaTimezone | null;
  readonly showOffset?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};

export const TimezoneDisplay = ({
  timezone,
  showOffset = true,
  fallback,
  typographyVariant,
  sx,
}: TimezoneDisplayProps): React.JSX.Element | null => {
  const locale = useAppLocale();
  const fallbackNode = fallback ? (
    <Box component="span" sx={mergeSx({ typography: typographyVariant, whiteSpace: "nowrap" }, sx)}>
      {fallback}
    </Box>
  ) : null;

  if (!timezone) {
    return fallbackNode;
  }

  const display = showOffset ? getTimezoneSelectLabel(timezone, locale) : getTimezonePathLabel(timezone, locale);

  return (
    <Box component="span" sx={mergeSx({ typography: typographyVariant, whiteSpace: "nowrap" }, sx)}>
      {display}
    </Box>
  );
};
