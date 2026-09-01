"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import type { LocaleEmojiProps } from "@/frontend/common/components/ui/display/localeEmoji/types/localeEmoji.types";
import type { CountryCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CountryType, getCountryDisplayName, getCountryEmoji } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

type CountryDisplaySlotProps = {
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiProps>;
  readonly spacing?: number;
  readonly flexWrap?: "wrap" | "nowrap" | "wrap-reverse";
  readonly defaultTypographyVariant?: UiTypographyVariant;
};

type CountryDisplaySharedProps = {
  readonly code?: CountryCode | null;
  readonly country?: CountryType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
} & CountryDisplaySlotProps;

export function CountryDisplayShared({
  code,
  country,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant,
  sx,
  LocaleEmoji,
  spacing = 1,
  flexWrap,
  defaultTypographyVariant,
}: CountryDisplaySharedProps): React.JSX.Element | null {
  const locale = useAppLocale();
  const resolvedVariant = typographyVariant ?? defaultTypographyVariant;
  const fallbackNode = fallback ? (
    <Typography variant={resolvedVariant} sx={{ whiteSpace: "nowrap" }}>
      {fallback}
    </Typography>
  ) : null;

  const resolvedCode = country?.code ?? code;
  if (!resolvedCode) {
    return fallbackNode;
  }

  const emoji = country?.emoji ?? getCountryEmoji(resolvedCode);
  const name = getCountryDisplayName(resolvedCode, locale);

  return (
    <Stack direction="row" spacing={spacing} sx={mergeSx({ alignItems: "center", flexWrap }, sx)}>
      {showEmoji && <LocaleEmoji emoji={emoji} />}
      {showLabel && (
        <Typography variant={resolvedVariant} sx={{ whiteSpace: "nowrap" }}>
          {name}
        </Typography>
      )}
    </Stack>
  );
}
