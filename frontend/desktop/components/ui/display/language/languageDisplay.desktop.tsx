"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { getLanguageDisplayName, getLanguageEmoji, type LanguageType } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type DesktopLanguageDisplayProps = {
  readonly code?: string | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};

export const DesktopLanguageDisplay = ({
  code,
  language,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant = "bodyMd",
  sx,
}: DesktopLanguageDisplayProps): React.JSX.Element | null => {
  const locale = useAppLocale();
  const fallbackNode = fallback ? (
    <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
      {fallback}
    </Typography>
  ) : null;

  const resolvedCode = language?.code ?? code;
  if (!resolvedCode) {
    return fallbackNode;
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
