"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { getLanguageDisplayName, getLanguageEmoji, type LanguageType } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";

export type DesktopLanguageDisplayProps = {
  readonly code?: string | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

export const DesktopLanguageDisplay: React.FC<DesktopLanguageDisplayProps> = ({
  code,
  language,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant = "bodyMd",
  sx,
}): React.ReactNode => {
  const locale = useAppLocale();

  const resolvedCode = language?.code ?? code;
  if (!resolvedCode) {
    return fallback ?? null;
  }

  const emoji = language?.emoji ?? getLanguageEmoji(resolvedCode);
  const name = getLanguageDisplayName(resolvedCode, locale);

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "nowrap", ...sx }}>
      {showEmoji && <DesktopLocaleEmoji emoji={emoji} />}
      {showLabel && (
        <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
          {name}
        </Typography>
      )}
    </Stack>
  );
};
