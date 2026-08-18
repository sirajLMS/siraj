"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { fromGraphqlIanaTimezone, getTimezonePathLabel, getTimezoneSelectLabel } from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export type TimezoneDisplayProps = {
  readonly timezone?: string | null;
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

  const normalizedTimezone = timezone.includes("/") ? timezone : fromGraphqlIanaTimezone(timezone);
  const display = showOffset
    ? getTimezoneSelectLabel(normalizedTimezone, locale)
    : getTimezonePathLabel(normalizedTimezone, locale);

  return (
    <Box component="span" sx={mergeSx({ typography: typographyVariant, whiteSpace: "nowrap" }, sx)}>
      {display}
    </Box>
  );
};
