"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import { useLocale } from "next-intl";
import type * as React from "react";
import { type CountryType, getCountryDisplayName, getCountryEmoji } from "@/frontend/lib/locale";
import { LocaleEmoji } from "./LocaleEmoji";

export type CountryDisplayProps = {
  readonly code?: string | null;
  readonly country?: CountryType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const CountryDisplay: React.FC<CountryDisplayProps> = ({
  code,
  country,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant,
  sx,
}): React.ReactNode => {
  const locale = useLocale();

  const resolvedCode = country?.code ?? code;
  if (!resolvedCode) {
    return fallback ?? null;
  }

  const emoji = country?.emoji ?? getCountryEmoji(resolvedCode);
  const name = getCountryDisplayName(resolvedCode, locale);

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", ...sx }}>
      {showEmoji && <LocaleEmoji emoji={emoji} />}
      {showLabel && (
        <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
          {name}
        </Typography>
      )}
    </Stack>
  );
};
