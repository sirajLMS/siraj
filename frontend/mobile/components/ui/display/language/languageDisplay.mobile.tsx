"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { getLanguageDisplayName, getLanguageEmoji, type LanguageType } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export type MobileLanguageDisplayProps = {
  readonly code?: string | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: NonNullable<TypographyProps["variant"]>;
  readonly sx?: SxProps<Theme>;
};

/**
 * Mobile-tier language display. Self-contained — no shared base.
 *
 * Differences vs desktop:
 * - Tighter `spacing={0.5}` (vs desktop `spacing={1}`) for dense inline rows.
 * - Default `typographyVariant="caption"` (vs desktop `"bodyMd"`) for compact
 *   mobile typography.
 * - `flexWrap: "nowrap"` to keep emoji + label on a single tight row.
 */
export const MobileLanguageDisplay: React.FC<MobileLanguageDisplayProps> = ({
  code,
  language,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant = "caption",
  sx,
}): React.ReactNode => {
  const locale = useAppLocale();

  const resolvedCode = language?.code ?? code;
  let content: React.ReactNode;
  if (!resolvedCode) {
    content = fallback ?? null;
  } else {
    const emoji = language?.emoji ?? getLanguageEmoji(resolvedCode);
    const name = getLanguageDisplayName(resolvedCode, locale);

    content = (
      <Stack direction="row" spacing={0.5} sx={mergeSx({ alignItems: "center", flexWrap: "nowrap" }, sx)}>
        {showEmoji && <MobileLocaleEmoji emoji={emoji} />}
        {showLabel && (
          <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
            {name}
          </Typography>
        )}
      </Stack>
    );
  }
  return content;
};
