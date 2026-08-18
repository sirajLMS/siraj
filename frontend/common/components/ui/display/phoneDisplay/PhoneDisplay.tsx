"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { formatPhoneDisplay, maskPhone } from "@/shared/lib/phone";

export type PhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};

export const PhoneDisplay = ({
  phone,
  masked = false,
  defaultRegion,
  fallback,
  typographyVariant,
  sx,
}: PhoneDisplayProps): React.JSX.Element | null => {
  const locale = useAppLocale();
  const fallbackNode: React.JSX.Element | null =
    fallback == null ? null : (
      <Box component="span" sx={mergeSx({ typography: typographyVariant, whiteSpace: "nowrap", direction: "ltr" }, sx)}>
        {fallback}
      </Box>
    );

  if (!phone) {
    return fallbackNode;
  }

  const display = masked ? maskPhone(phone, defaultRegion) : formatPhoneDisplay(phone, locale);

  return (
    <Box component="span" sx={mergeSx({ typography: typographyVariant, whiteSpace: "nowrap", direction: "ltr" }, sx)}>
      {display}
    </Box>
  );
};
