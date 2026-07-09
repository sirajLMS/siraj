"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import { useLocale } from "next-intl";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display/LocaleEmoji";
import { getLanguageDisplayName, getLanguageEmoji, type LanguageType } from "@/frontend/lib/locale";

export type LanguageDisplayProps = {
  readonly code?: string | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const LanguageDisplay: React.FC<LanguageDisplayProps> = ({
  code,
  language,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant,
  sx,
}): React.ReactNode => {
  const locale = useLocale();

  const resolvedCode = language?.code ?? code;
  if (!resolvedCode) {
    return fallback ?? null;
  }

  const emoji = language?.emoji ?? getLanguageEmoji(resolvedCode);
  const name = getLanguageDisplayName(resolvedCode, locale);

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
